"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FolderTree, Copy, Download, File, Folder, ChevronRight, ChevronDown } from "lucide-react"
import { toast } from "sonner"

interface TreeNode {
  name: string
  type: "file" | "folder"
  children?: TreeNode[]
  expanded?: boolean
}

export default function DirectoryTreePage() {
  const [treeInput, setTreeInput] = useState("")
  const [tree, setTree] = useState<TreeNode[]>([])
  const [treeOutput, setTreeOutput] = useState("")

  const parseTree = () => {
    try {
      const lines = treeInput.split("\n").filter((line) => line.trim())
      const root: TreeNode[] = []
      const stack: { node: TreeNode[]; depth: number }[] = [{ node: root, depth: -1 }]

      lines.forEach((line) => {
        const depth = line.search(/\S/)
        const name = line.trim()
        const isFolder = name.endsWith("/")

        const newNode: TreeNode = {
          name: isFolder ? name.slice(0, -1) : name,
          type: isFolder ? "folder" : "file",
          children: isFolder ? [] : undefined,
          expanded: true,
        }

        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
          stack.pop()
        }

        const parent = stack[stack.length - 1].node
        parent.push(newNode)

        if (isFolder && newNode.children) {
          stack.push({ node: newNode.children, depth })
        }
      })

      setTree(root)
      generateTreeOutput(root)
      toast.success("Directory tree created")
    } catch (error) {
      toast.error("Error parsing tree structure")
    }
  }

  const generateTreeOutput = (nodes: TreeNode[], prefix = "", isLast = true) => {
    let output = ""
    nodes.forEach((node, index) => {
      const isLastNode = index === nodes.length - 1
      const connector = isLastNode ? "└── " : "├── "
      const extension = isLastNode ? "    " : "│   "

      output += prefix + connector + node.name + (node.type === "folder" ? "/" : "") + "\n"

      if (node.children && node.expanded) {
        output += generateTreeOutput(node.children, prefix + extension, isLastNode)
      }
    })
    setTreeOutput((prev) => prev + output)
    return output
  }

  const toggleNode = (nodes: TreeNode[], targetName: string): TreeNode[] => {
    return nodes.map((node) => {
      if (node.name === targetName) {
        return { ...node, expanded: !node.expanded }
      }
      if (node.children) {
        return { ...node, children: toggleNode(node.children, targetName) }
      }
      return node
    })
  }

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node, index) => (
      <div key={`${node.name}-${index}`} style={{ marginLeft: `${depth * 20}px` }}>
        <button
          onClick={() => setTree((prev) => toggleNode(prev, node.name))}
          className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded w-full text-left"
        >
          {node.type === "folder" && (
            <span className="text-muted-foreground">
              {node.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          {node.type === "folder" ? (
            <Folder className="h-4 w-4 text-yellow-500" />
          ) : (
            <File className="h-4 w-4 text-blue-500" />
          )}
          <span className="text-sm">{node.name}</span>
        </button>
        {node.children && node.expanded && renderTree(node.children, depth + 1)}
      </div>
    ))
  }

  const copyTree = () => {
    navigator.clipboard.writeText(treeOutput)
    toast.success("Tree copied to clipboard")
  }

  const downloadTree = () => {
    const blob = new Blob([treeOutput], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "directory-tree.txt"
    a.click()
    toast.success("Tree downloaded")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
            <FolderTree className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Directory Tree Creator</h1>
        </div>
        <p className="text-muted-foreground">Create and visualize directory structures</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Directory Structure (end folders with /)</Label>
              <Textarea
                value={treeInput}
                onChange={(e) => setTreeInput(e.target.value)}
                placeholder={"project/\n  src/\n    main.ts\n    utils.ts\n  package.json\n  README.md"}
                className="h-64 font-mono text-sm"
              />
            </div>
            <Button onClick={parseTree} className="w-full">
              <FolderTree className="mr-2 h-4 w-4" />
              Generate Tree
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {tree.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Visual Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-muted/30">{renderTree(tree)}</div>
              </CardContent>
            </Card>
          )}

          {treeOutput && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Text Output</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyTree}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTree}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted/30 p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                  {treeOutput}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
