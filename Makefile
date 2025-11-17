.PHONY: up down build clean logs restart

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

clean:
	docker-compose down -v
	rm -rf downloads/*

logs:
	docker-compose logs -f

restart:
	docker-compose restart

backend-logs:
	docker-compose logs -f backend

frontend-logs:
	docker-compose logs -f frontend
