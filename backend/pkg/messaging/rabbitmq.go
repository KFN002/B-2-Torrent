package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

type RabbitMQ struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	logger  *zap.Logger
}

type Event struct {
	Type      string                 `json:"type"`
	Payload   map[string]interface{} `json:"payload"`
	Timestamp time.Time              `json:"timestamp"`
}

func NewRabbitMQ(url string, logger *zap.Logger) (*RabbitMQ, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	// Declare exchanges
	if err := channel.ExchangeDeclare(
		"torrent_events",
		"topic",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}
	if err := channel.ExchangeDeclare("torrent_events.dead", "topic", true, false, false, false, nil); err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare dead-letter exchange: %w", err)
	}
	deadQueue, err := channel.QueueDeclare("torrent_events.dead", true, false, false, false, amqp.Table{
		"x-max-length":  int32(1000),
		"x-message-ttl": int32(86400000),
	})
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare bounded dead-letter queue: %w", err)
	}
	if err := channel.QueueBind(deadQueue.Name, "#", "torrent_events.dead", false, nil); err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to bind dead-letter queue: %w", err)
	}

	logger.Info("RabbitMQ connected successfully")

	return &RabbitMQ{
		conn:    conn,
		channel: channel,
		logger:  logger,
	}, nil
}

func (r *RabbitMQ) Publish(ctx context.Context, routingKey string, event Event) error {
	event.Timestamp = time.Now()
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	if err := r.channel.PublishWithContext(
		ctx,
		"torrent_events",
		routingKey,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			Timestamp:    event.Timestamp,
			DeliveryMode: amqp.Persistent,
		},
	); err != nil {
		r.logger.Error("Failed to publish event", zap.Error(err), zap.String("routingKey", routingKey))
		return fmt.Errorf("failed to publish event: %w", err)
	}

	r.logger.Debug("Event published", zap.String("type", event.Type), zap.String("routingKey", routingKey))
	return nil
}

func (r *RabbitMQ) Subscribe(queueName, routingKey string, handler func(Event) error) error {
	queue, err := r.channel.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		amqp.Table{
			"x-dead-letter-exchange": "torrent_events.dead",
		},
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	if err := r.channel.QueueBind(
		queue.Name,
		routingKey,
		"torrent_events",
		false,
		nil,
	); err != nil {
		return fmt.Errorf("failed to bind queue: %w", err)
	}

	msgs, err := r.channel.Consume(
		queue.Name,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	go func() {
		for msg := range msgs {
			var event Event
			if err := json.Unmarshal(msg.Body, &event); err != nil {
				r.logger.Error("Failed to unmarshal event", zap.Error(err))
				msg.Nack(false, false)
				continue
			}

			if err := handler(event); err != nil {
				r.logger.Error("Failed to handle event", zap.Error(err), zap.String("type", event.Type))
				// Poison messages are dead-lettered instead of requeued forever.
				msg.Nack(false, false)
			} else {
				msg.Ack(false)
			}
		}
	}()

	r.logger.Info("Subscribed to events", zap.String("queue", queueName), zap.String("routingKey", routingKey))
	return nil
}

func (r *RabbitMQ) Close() error {
	if r.channel != nil {
		r.channel.Close()
	}
	if r.conn != nil {
		return r.conn.Close()
	}
	return nil
}
