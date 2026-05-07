'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Scissors, File, Download, Upload } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

export default function FileSplitterPage() {
  const { t } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [chunks, setChunks] = useState<Blob[]>([])
  const [chunkSize, setChunkSize] = useState(10)
  const [progress, setProgress] = useState(0)
  const [mode, setMode] = useState<'split' | 'join'>('split')
  const [joinFiles, setJoinFiles] = useState<File[]>([])

  const handleSplit = async () => {
    if (!file) return
    
    const chunkSizeBytes = chunkSize * 1024 * 1024
    const totalChunks = Math.ceil(file.size / chunkSizeBytes)
    const newChunks: Blob[] = []
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSizeBytes
      const end = Math.min(start + chunkSizeBytes, file.size)
      const chunk = file.slice(start, end)
      newChunks.push(chunk)
      setProgress(((i + 1) / totalChunks) * 100)
    }
    
    setChunks(newChunks)
  }

  const handleJoin = async () => {
    if (joinFiles.length === 0) return
    
    const sortedFiles = joinFiles.sort((a, b) => a.name.localeCompare(b.name))
    const blob = new Blob(sortedFiles)
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'joined-file'
    a.click()
    URL.revokeObjectURL(url)
    
    setProgress(100)
  }

  const downloadChunk = (chunk: Blob, index: number) => {
    const url = URL.createObjectURL(chunk)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name}.part${index + 1}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Scissors className="h-8 w-8" />
          <h1 className="text-3xl font-bold">File Splitter & Joiner</h1>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={mode === 'split' ? 'default' : 'outline'}
            onClick={() => setMode('split')}
          >
            Split Files
          </Button>
          <Button 
            variant={mode === 'join' ? 'default' : 'outline'}
            onClick={() => setMode('join')}
          >
            Join Files
          </Button>
        </div>

        {mode === 'split' ? (
          <Card>
            <CardHeader>
              <CardTitle>Split Large Files</CardTitle>
              <CardDescription>
                Split large files into smaller chunks for easier transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null)
                    setChunks([])
                    setProgress(0)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chunkSize">Chunk Size (MB)</Label>
                <Input
                  id="chunkSize"
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  min="1"
                  max="1000"
                />
              </div>

              {file && (
                <div className="text-sm text-muted-foreground">
                  File size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  <br />
                  Estimated chunks: {Math.ceil(file.size / (chunkSize * 1024 * 1024))}
                </div>
              )}

              <Button onClick={handleSplit} disabled={!file} className="w-full">
                <Scissors className="h-4 w-4 mr-2" />
                Split File
              </Button>

              {progress > 0 && progress < 100 && (
                <Progress value={progress} className="w-full" />
              )}

              {chunks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Download Chunks</h3>
                  <div className="grid gap-2">
                    {chunks.map((chunk, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-between"
                        onClick={() => downloadChunk(chunk, index)}
                      >
                        <span>Part {index + 1} ({(chunk.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <Download className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Join File Chunks</CardTitle>
              <CardDescription>
                Select multiple file chunks to join them back together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="files">Select File Chunks</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={(e) => {
                    setJoinFiles(Array.from(e.target.files || []))
                    setProgress(0)
                  }}
                />
              </div>

              {joinFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Selected {joinFiles.length} file(s)
                </div>
              )}

              <Button onClick={handleJoin} disabled={joinFiles.length === 0} className="w-full">
                <File className="h-4 w-4 mr-2" />
                Join Files
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
