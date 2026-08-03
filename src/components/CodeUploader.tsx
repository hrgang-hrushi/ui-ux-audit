import React, { useState, useRef } from "react";
import JSZip from "jszip";
import { 
  Upload, 
  FileCode, 
  FolderUp, 
  Archive, 
  Check, 
  X, 
  FileText, 
  AlertCircle, 
  Search, 
  ChevronRight, 
  Eye, 
  CheckSquare, 
  Square,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface UploadedFile {
  name: string;
  path: string;
  content: string;
  size: number;
  isSelected: boolean;
}

interface CodeUploaderProps {
  onCodeLoaded: (combinedCode: string) => void;
  onClose?: () => void;
}

const isReadableFile = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  
  // Exclude node_modules, .git, dist, image files, and lockfiles
  const lowercasePath = filename.toLowerCase();
  if (
    lowercasePath.includes("node_modules/") ||
    lowercasePath.includes(".git/") ||
    lowercasePath.includes("dist/") ||
    lowercasePath.includes("build/") ||
    lowercasePath.includes(".next/") ||
    lowercasePath.includes("package-lock.json") ||
    lowercasePath.includes("yarn.lock") ||
    lowercasePath.includes("pnpm-lock.yaml") ||
    lowercasePath.includes(".ds_store") ||
    lowercasePath.includes(".png") ||
    lowercasePath.includes(".jpg") ||
    lowercasePath.includes(".jpeg") ||
    lowercasePath.includes(".gif") ||
    lowercasePath.includes(".ico") ||
    lowercasePath.includes(".woff") ||
    lowercasePath.includes(".woff2") ||
    lowercasePath.includes(".ttf")
  ) {
    return false;
  }

  const readableExtensions = [
    "html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "md", 
    "txt", "vue", "svelte", "xml", "yaml", "yml", "svg"
  ];
  return readableExtensions.includes(ext);
};

export default function CodeUploader({ onCodeLoaded, onClose }: CodeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle dropped files
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  // Main file processing orchestrator
  const processFiles = async (fileList: FileList) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    const parsedFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const isZip = file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed";
        
        if (isZip) {
          // Process ZIP
          try {
            const zip = await JSZip.loadAsync(file);
            for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
              if (!zipEntry.dir && isReadableFile(relativePath)) {
                const content = await zipEntry.async("string");
                parsedFiles.push({
                  name: zipEntry.name.split("/").pop() || zipEntry.name,
                  path: relativePath,
                  content,
                  size: content.length,
                  isSelected: true,
                });
              }
            }
          } catch (zipErr) {
            console.error("ZIP processing failed:", zipErr);
            throw new Error(`Failed to extract ZIP archive: ${file.name}`);
          }
        } else {
          // Process individual file or webkit directory file
          const path = (file as any).webkitRelativePath || file.name;
          if (isReadableFile(path)) {
            const content = await file.text();
            parsedFiles.push({
              name: file.name,
              path: path,
              content,
              size: file.size,
              isSelected: true,
            });
          }
        }
      }

      if (parsedFiles.length === 0) {
        throw new Error("No readable code files detected (.html, .css, .js, .jsx, .ts, .tsx, .json, .md, etc.). Please make sure files are not binary or locked.");
      }

      setFiles(prev => {
        // Merge or replace based on preference. Let's merge and remove duplicates by path.
        const merged = [...prev];
        parsedFiles.forEach(pf => {
          const existsIdx = merged.findIndex(m => m.path === pf.path);
          if (existsIdx > -1) {
            merged[existsIdx] = pf;
          } else {
            merged.push(pf);
          }
        });
        return merged;
      });

      setSuccessMsg(`Successfully parsed ${parsedFiles.length} file(s). Select which components to include in the visual audit.`);
    } catch (err: any) {
      setError(err.message || "An error occurred while uploading. Please try another file.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle single file selection
  const toggleFileSelect = (path: string) => {
    setFiles(prev => prev.map(f => f.path === path ? { ...f, isSelected: !f.isSelected } : f));
  };

  // Toggle all files
  const toggleAll = (select: boolean) => {
    setFiles(prev => prev.map(f => ({ ...f, isSelected: select })));
  };

  // Format bytes nicely
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Assemble and return the combined code blocks
  const handleAssembleAndLoad = () => {
    const selectedFiles = files.filter(f => f.isSelected);
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to include in the audit.");
      return;
    }

    let combined = "";
    selectedFiles.forEach(f => {
      combined += `\n/* =========================================================================\n`;
      combined += `   FILE: ${f.path}\n`;
      combined += `   SIZE: ${formatBytes(f.size)}\n`;
      combined += `   ========================================================================= */\n\n`;
      combined += f.content;
      combined += `\n\n`;
    });

    onCodeLoaded(combined);
    
    if (onClose) {
      onClose();
    }
  };

  // Filtered list
  const filteredFiles = files.filter(f => 
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = files.filter(f => f.isSelected).length;
  const totalSize = files.filter(f => f.isSelected).reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-3 ${
          dragActive 
            ? "border-white bg-[#1C1C1E]" 
            : "border-[#2A2A2D] bg-black/40 hover:bg-black/60 hover:border-[#3E3E42]"
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden" 
        />
        <input 
          ref={folderInputRef}
          type="file" 
          webkitdirectory="" 
          directory="" 
          multiple
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden" 
        />
        <input 
          ref={zipInputRef}
          type="file" 
          accept=".zip"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden" 
        />

        <div className="relative">
          <div className="p-3 bg-neutral-900 rounded-full border border-[#2A2A2D] text-white">
            <Upload className="h-5 w-5 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 text-black">
            <CheckSquare className="h-3 w-3" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-white">
            Drag & Drop or click to browse
          </p>
          <p className="text-[10px] text-[#6B6B6F] max-w-xs mx-auto leading-normal">
            Supports <strong className="text-[#E0E0E0]">Single/Multiple code files</strong>, complete <strong className="text-[#E0E0E0]">Folders</strong>, or compressed <strong className="text-[#E0E0E0]">ZIP archives</strong>.
          </p>
        </div>

        {/* Quick helper buttons inside zone to trigger directory/ZIP explicit prompts */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black border border-[#2A2A2D] text-[10px] font-mono text-[#E0E0E0] transition cursor-pointer"
          >
            <FolderUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Upload Folder</span>
          </button>
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black border border-[#2A2A2D] text-[10px] font-mono text-[#E0E0E0] transition cursor-pointer"
          >
            <Archive className="h-3.5 w-3.5 text-purple-400" />
            <span>Upload ZIP</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-4 border border-[#2A2A2D] bg-[#141416] rounded-xl">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#E0E0E0] font-mono">Unpacking and scanning source files...</p>
        </div>
      )}

      {/* Error Block */}
      {error && (
        <div className="p-3.5 bg-red-950/20 border border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-mono">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <p className="font-semibold">Upload Refused</p>
            <p className="mt-0.5 leading-normal text-red-400/80">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Success Block */}
      {successMsg && (
        <div className="p-3 bg-green-950/20 border border-green-900/50 rounded-xl flex items-start gap-2 text-[11px] text-green-400 font-mono">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-green-400 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Files list panel */}
      {files.length > 0 && (
        <div className="border border-[#2A2A2D] bg-[#141416] rounded-xl overflow-hidden space-y-3 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2D]">
            <div>
              <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">
                Source Files Catalog ({files.length})
              </h4>
              <p className="text-[10px] text-[#6B6B6F] font-mono mt-0.5">
                {selectedCount} files selected ({formatBytes(totalSize)})
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="text-[#E0E0E0] hover:text-white underline cursor-pointer"
              >
                All
              </button>
              <span className="text-[#2A2A2D]">|</span>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="text-[#6B6B6F] hover:text-white underline cursor-pointer"
              >
                None
              </button>
            </div>
          </div>

          {/* Search bar inside list */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#6B6B6F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components or file paths..."
              className="w-full bg-black border border-[#2A2A2D] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-white font-mono"
            />
          </div>

          {/* Scrolling files list */}
          <div className="max-h-48 overflow-y-auto divide-y divide-[#2A2A2D] border border-[#2A2A2D] rounded-lg bg-black scrollbar-thin">
            {filteredFiles.length === 0 ? (
              <p className="p-4 text-center text-xs text-[#6B6B6F] font-mono">
                No matching files found.
              </p>
            ) : (
              filteredFiles.map((f) => {
                const isHtml = f.name.endsWith(".html") || f.name.endsWith(".htm");
                const isCss = f.name.endsWith(".css");
                const isCode = !isHtml && !isCss;

                return (
                  <div 
                    key={f.path} 
                    className="flex items-center justify-between p-2 hover:bg-[#141416] transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleFileSelect(f.path)}
                        className="text-[#6B6B6F] hover:text-white cursor-pointer"
                      >
                        {f.isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isHtml ? (
                          <FileCode className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        ) : isCss ? (
                          <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <FileCode className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-white truncate font-mono">
                            {f.name}
                          </p>
                          <p className="text-[9px] text-[#6B6B6F] truncate font-mono">
                            {f.path} • {formatBytes(f.size)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewFile(f)}
                      className="p-1 text-[#6B6B6F] hover:text-white rounded hover:bg-neutral-900 opacity-0 group-hover:opacity-100 focus:opacity-100 transition cursor-pointer"
                      title="Preview content"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Large Action button to aggregate and pack */}
          <button
            type="button"
            onClick={handleAssembleAndLoad}
            className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#E0E0E0] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Load {selectedCount} Selected File(s)</span>
          </button>
        </div>
      )}

      {/* Code preview popup modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#141416] border border-[#2A2A2D] w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
            >
              <div className="px-4 py-3 bg-black border-b border-[#2A2A2D] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white font-mono truncate">{previewFile.name}</h4>
                    <p className="text-[10px] text-[#6B6B6F] font-mono truncate">{previewFile.path} • {formatBytes(previewFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-md bg-[#141416] hover:bg-neutral-900 border border-[#2A2A2D] text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 bg-black overflow-auto flex-1 font-mono text-[11px] text-[#E0E0E0] leading-relaxed whitespace-pre scrollbar-thin">
                {previewFile.content || "// File is empty"}
              </div>

              <div className="p-3 bg-[#141416] border-t border-[#2A2A2D] flex items-center justify-between">
                <span className="text-[10px] text-[#6B6B6F] font-mono flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-[#6B6B6F]" />
                  Read-only preview
                </span>
                <button
                  type="button"
                  onClick={() => {
                    toggleFileSelect(previewFile.path);
                    setPreviewFile(null);
                  }}
                  className={`px-3 py-1 text-[11px] font-mono font-semibold rounded-md border transition cursor-pointer ${
                    previewFile.isSelected 
                      ? "bg-red-950/20 text-red-400 border-red-900/50 hover:bg-red-900/30"
                      : "bg-emerald-950/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30"
                  }`}
                >
                  {previewFile.isSelected ? "Exclude File" : "Include File"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
