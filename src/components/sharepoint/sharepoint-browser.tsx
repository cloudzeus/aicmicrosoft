"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  FaFolder, 
  FaFile, 
  FaSearch, 
  FaExternalLinkAlt, 
  FaArrowLeft, 
  FaHome,
  FaBuilding,
  FaCalendarAlt,
  FaFileAlt,
  FaFolderOpen,
  FaCloud,
  FaDatabase
} from "react-icons/fa"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface SharePointSite {
  id: string
  displayName: string
  webUrl: string
  description?: string
  siteCollection?: {
    hostname: string
  }
  createdDateTime: string
  lastModifiedDateTime: string
  isFromTenantSync?: boolean
}

interface SharePointDriveItem {
  id: string
  name: string
  webUrl: string
  size: number
  lastModifiedDateTime: string
  createdDateTime: string
  folder?: {
    childCount: number
  }
  file?: {
    mimeType: string
    hashes?: {
      sha1Hash?: string
      quickXorHash?: string
    }
  }
  parentReference?: {
    driveId: string
    driveType: string
    id: string
    name: string
    path: string
  }
}

export function SharePointBrowser() {
  const [sites, setSites] = useState<SharePointSite[]>([])
  const [selectedSite, setSelectedSite] = useState<SharePointSite | null>(null)
  const [files, setFiles] = useState<SharePointDriveItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [currentFolderName, setCurrentFolderName] = useState<string>("Root")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [contextFolder, setContextFolder] = useState<SharePointDriveItem | null>(null)
  const [subfolderOpen, setSubfolderOpen] = useState(false)
  const [subfolderName, setSubfolderName] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")

  // Fetch SharePoint sites
  const fetchSites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/sharepoint/sites', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSites(data.sites || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch SharePoint sites')
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
      setError('Failed to fetch SharePoint sites')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch files for selected site/folder
  const fetchFiles = useCallback(async (siteId: string, folderId?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ siteId })
      if (folderId) params.append('folderId', folderId)
      
      const response = await fetch(`/api/sharepoint/files?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
        setCurrentFolder(folderId || null)
        if (!folderId) setCurrentFolderName('Root')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setError('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle site selection
  const handleSiteSelect = (site: SharePointSite) => {
    setSelectedSite(site)
    setCurrentFolder(null)
    fetchFiles(site.id)
  }

  // Handle folder navigation
  const handleFolderClick = (item: SharePointDriveItem) => {
    if (item.folder && selectedSite) {
      setCurrentFolderName(item.name)
      fetchFiles(selectedSite.id, item.id)
    }
  }

  // Context menu actions
  const openContextMenu = (item: SharePointDriveItem) => {
    setContextFolder(item)
  }

  const onAddSubfolder = () => {
    setSubfolderName("")
    setSubfolderOpen(true)
  }

  const createSubfolder = async () => {
    if (!selectedSite || !contextFolder || !subfolderName.trim()) return
    try {
      setCreating(true)
      const res = await fetch('/api/sharepoint/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite.id,
          parentFolderId: contextFolder.id,
          name: subfolderName.trim()
        })
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }
      setSubfolderOpen(false)
      await fetchFiles(selectedSite.id, currentFolder || undefined)
    } catch (e) {
      console.error('Failed to create subfolder', e)
      alert('Failed to create subfolder')
    } finally {
      setCreating(false)
    }
  }

  const onUploadFile = () => {
    setUploadOpen(true)
  }

  const uploadFile = async (file: File) => {
    if (!selectedSite || !contextFolder) return
    try {
      setUploading(true)
      const form = new FormData()
      form.append('siteId', selectedSite.id)
      form.append('parentFolderId', contextFolder.id)
      form.append('file', file)
      const res = await fetch('/api/sharepoint/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }
      setUploadOpen(false)
      await fetchFiles(selectedSite.id, currentFolder || undefined)
    } catch (e) {
      console.error('Failed to upload file', e)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  // File actions
  const deleteItem = async (item: SharePointDriveItem) => {
    if (!selectedSite) return
    if (!confirm(`Delete ${item.name}?`)) return
    try {
      const params = new URLSearchParams({ siteId: selectedSite.id, itemId: item.id })
      const res = await fetch(`/api/sharepoint/items?${params.toString()}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      await fetchFiles(selectedSite.id, currentFolder || undefined)
    } catch (e) {
      console.error('Failed to delete item', e)
      alert('Failed to delete item')
    }
  }
  const downloadItem = async (item: SharePointDriveItem) => {
    if (!selectedSite) return
    const params = new URLSearchParams({ siteId: selectedSite.id, itemId: item.id })
    const url = `/api/sharepoint/items?${params.toString()}`
    window.open(url, '_blank')
  }
  const copyLink = (item: SharePointDriveItem) => {
    navigator.clipboard.writeText(item.webUrl)
  }
  const onRenameItem = (item: SharePointDriveItem) => {
    setContextFolder(item)
    setRenameValue(item.name)
    setRenameOpen(true)
  }
  const renameItem = async () => {
    if (!selectedSite || !contextFolder || !renameValue.trim()) return
    try {
      const res = await fetch('/api/sharepoint/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: selectedSite.id, itemId: contextFolder.id, name: renameValue.trim() })
      })
      if (!res.ok) throw new Error(await res.text())
      setRenameOpen(false)
      await fetchFiles(selectedSite.id, currentFolder || undefined)
    } catch (e) {
      console.error('Failed to rename item', e)
      alert('Failed to rename item')
    }
  }

  // Handle file click (open in new tab)
  const handleFileClick = (item: SharePointDriveItem) => {
    window.open(item.webUrl, '_blank')
  }

  // Go back to parent folder
  const goBack = () => {
    if (selectedSite) {
      fetchFiles(selectedSite.id)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Filter files based on search term
  const filteredFiles = files.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Load sites on mount
  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <FaBuilding className="w-4 h-4 text-gray-600" />
            SharePoint sites & files
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="text-red-700">{error}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sites List */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
              <FaBuilding className="w-4 h-4 text-gray-600" />
              SharePoint sites
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {sites.map((site) => (
                  <div
                    key={site.id}
                    className={`px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer hover:bg-gray-50 transition ${
                      selectedSite?.id === site.id ? 'ring-1 ring-blue-500/40 bg-blue-50' : ''
                    }`}
                    onClick={() => handleSiteSelect(site)}
                  >
                    <div className="flex items-center gap-3">
                      <FaBuilding className="w-4 h-4 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-[13px] text-gray-900 truncate">{site.displayName}</div>
                          {site.isFromTenantSync !== undefined && (
                            <Badge 
                              variant={site.isFromTenantSync ? "default" : "secondary"}
                              className={`text-[10px] px-1 py-0.5 ${
                                site.isFromTenantSync 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              {site.isFromTenantSync ? (
                                <>
                                  <FaCloud className="w-2 h-2 mr-1" />
                                  Office 365
                                </>
                              ) : (
                                <>
                                  <FaDatabase className="w-2 h-2 mr-1" />
                                  Local
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[12px] text-gray-500 truncate">{site.webUrl}</div>
                        {site.description && (
                          <div className="text-[12px] text-gray-400 truncate">{site.description}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-[12px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(site.webUrl, '_blank')
                        }}
                      >
                        <FaExternalLinkAlt className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files List */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
                <FaFolderOpen className="w-4 h-4 text-gray-600" />
                Files & folders
                {selectedSite && (
                  <Badge variant="outline" className="text-[11px]">{selectedSite.displayName}</Badge>
                )}
              </CardTitle>
              {currentFolder && (
                <Button size="sm" variant="outline" className="h-8 px-3 text-[12px]" onClick={goBack}>
                  <FaArrowLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {!selectedSite ? (
              <div className="text-center py-8 text-gray-500">
                <FaFolder className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-[13px]">Select a SharePoint site to view files</p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-[13px]"
                  />
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[12px] text-gray-600 mb-3">
                  <FaHome className="w-3 h-3" />
                  <span className="text-gray-400">/</span>
                  {currentFolder ? (
                    <>
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <span
                            className="underline decoration-dotted underline-offset-4 cursor-context-menu hover:text-gray-900"
                            onContextMenu={() => { setContextFolder({ id: 'root', name: 'Root', webUrl: selectedSite?.webUrl || '#', size: 0, lastModifiedDateTime: new Date().toISOString(), createdDateTime: new Date().toISOString(), folder: { childCount: 0 } }) }}
                          >
                            Root
                          </span>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={onAddSubfolder}>Add subfolder</ContextMenuItem>
                          <ContextMenuItem onClick={onUploadFile}>Upload file</ContextMenuItem>
                          <ContextMenuItem onClick={() => selectedSite && window.open(selectedSite.webUrl, '_blank')}>Open in SharePoint</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-900">{currentFolderName}</span>
                    </>
                  ) : (
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <span
                          className="underline decoration-dotted underline-offset-4 cursor-context-menu hover:text-gray-900"
                          onContextMenu={() => { setContextFolder({ id: 'root', name: 'Root', webUrl: selectedSite?.webUrl || '#', size: 0, lastModifiedDateTime: new Date().toISOString(), createdDateTime: new Date().toISOString(), folder: { childCount: 0 } }) }}
                        >
                          Root
                        </span>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={onAddSubfolder}>Add subfolder</ContextMenuItem>
                        <ContextMenuItem onClick={onUploadFile}>Upload file</ContextMenuItem>
                        <ContextMenuItem onClick={() => selectedSite && window.open(selectedSite.webUrl, '_blank')}>Open in SharePoint</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )}
                </div>

                <Separator className="mb-3" />

                {/* Files List */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {filteredFiles.map((item) => (
                      item.folder ? (
                        <ContextMenu key={item.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition"
                              onClick={() => handleFolderClick(item)}
                              onContextMenu={() => { openContextMenu(item) }}
                            >
                              <div className="flex-shrink-0">
                                <FaFolder className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[13px] text-gray-900 truncate">{item.name}</div>
                                <div className="text-[12px] text-gray-500">{`${item.folder.childCount} items`}</div>
                                <div className="text-[12px] text-gray-400">Modified: {new Date(item.lastModifiedDateTime).toLocaleDateString()}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-[12px]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(item.webUrl, '_blank')
                                }}
                              >
                                <FaExternalLinkAlt className="w-3 h-3" />
                              </Button>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => onRenameItem(item)}>Rename</ContextMenuItem>
                            <ContextMenuItem onClick={onAddSubfolder}>Add subfolder</ContextMenuItem>
                            <ContextMenuItem onClick={onUploadFile}>Upload file</ContextMenuItem>
                            <ContextMenuItem onClick={() => contextFolder && window.open(contextFolder.webUrl, '_blank')}>Open in SharePoint</ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ) : (
                        <ContextMenu key={item.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition"
                              onClick={() => handleFileClick(item)}
                            >
                              <div className="flex-shrink-0">
                                <FaFile className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[13px] text-gray-900 truncate">{item.name}</div>
                                <div className="text-[12px] text-gray-500">{formatFileSize(item.size)}</div>
                                <div className="text-[12px] text-gray-400">Modified: {new Date(item.lastModifiedDateTime).toLocaleDateString()}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-[12px]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(item.webUrl, '_blank')
                                }}
                              >
                                <FaExternalLinkAlt className="w-3 h-3" />
                              </Button>
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => onRenameItem(item)}>Rename</ContextMenuItem>
                            <ContextMenuItem onClick={() => downloadItem(item)}>Download</ContextMenuItem>
                            <ContextMenuItem onClick={() => copyLink(item)}>Copy link</ContextMenuItem>
                            <ContextMenuItem variant="destructive" onClick={() => deleteItem(item)}>Delete</ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )
                    ))}
                    {filteredFiles.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-500">
                        <FaFileAlt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-[13px]">No files found</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Subfolder Dialog */}
      <Dialog open={subfolderOpen} onOpenChange={setSubfolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create subfolder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="subfolderName">Folder name</Label>
            <Input id="subfolderName" value={subfolderName} onChange={(e) => setSubfolderName(e.target.value)} placeholder="New folder" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSubfolderOpen(false)}>Cancel</Button>
              <Button onClick={createSubfolder} disabled={creating || !subfolderName.trim()}>{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload file</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="file" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadFile(f)
            }} />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="renameValue">New name</Label>
            <Input id="renameValue" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
              <Button onClick={renameItem} disabled={!renameValue.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
