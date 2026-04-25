"use client";

/* eslint-disable @next/next/no-img-element */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  defaultFashionPageContent,
  fashionBlockTypes,
  type FashionBlock,
  type FashionBlockType,
  type FashionMediaItem,
  type FashionPageContent,
} from "@/data/fashionPage";
import styles from "./AdminUploader.module.css";

type PartUrl = { partNumber: number; url: string };
type InitResp = {
  key: string;
  uploadId: string;
  partSize: number;
  partUrls: PartUrl[];
};
type UploadedPart = { partNumber: number; etag: string };
type SaveState = "idle" | "loading" | "saving" | "saved" | "error";
type InspectorTab = "block" | "add" | "media" | "settings";

const PARALLEL_PARTS = 4;

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneContent(content: FashionPageContent): FashionPageContent {
  return JSON.parse(JSON.stringify(content)) as FashionPageContent;
}

function createItem(): FashionMediaItem {
  return {
    id: uid("item"),
    title: "New project",
    subtitle: "",
    mediaUrl: "",
    mediaKind: "image",
    aspect: "portrait",
  };
}

function createReviewItem(): FashionMediaItem {
  return {
    id: uid("review"),
    title: "Client name",
    subtitle: "Write the review quote here.",
    meta: "Role or company",
    mediaUrl: "",
    mediaKind: "image",
  };
}

function createBlock(type: FashionBlockType): FashionBlock {
  const base: FashionBlock = {
    id: uid(type),
    type,
    kicker: "",
    title: "New block",
    subtitle: "",
    body: "",
    mediaUrl: "",
    mediaKind: "image",
    videoUrl: "",
    ctaLabel: "",
    ctaHref: "",
  };

  if (type === "mediaPair") {
    return {
      ...base,
      title: "Two chapter spread",
      items: [createItem(), createItem()],
    };
  }

  if (type === "carousel" || type === "projectGrid") {
    return { ...base, items: [createItem()] };
  }

  if (type === "reviews") {
    return {
      ...base,
      kicker: "Reviews",
      title: "What collaborators say",
      subtitle: "Selected notes from clients and collaborators.",
      items: [createReviewItem()],
    };
  }

  return base;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function supportsItems(type: FashionBlockType) {
  return (
    type === "mediaPair" ||
    type === "carousel" ||
    type === "projectGrid" ||
    type === "reviews"
  );
}

export default function AdminUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [content, setContent] = useState<FashionPageContent>(
    defaultFashionPageContent,
  );
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [saveMessage, setSaveMessage] = useState("");
  const [addType, setAddType] = useState<FashionBlockType>("feature");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState(
    defaultFashionPageContent.blocks[0]?.id ?? "",
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("block");

  const selectedBlockIndex = content.blocks.findIndex(
    (block) => block.id === selectedBlockId,
  );
  const selectedBlock =
    selectedBlockIndex >= 0 ? content.blocks[selectedBlockIndex] : null;
  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  useEffect(() => {
    let ignore = false;

    async function loadFashionContent() {
      setSaveState("loading");
      try {
        const res = await fetch("/api/admin/fashion", { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "Không tải được cấu trúc Fashion");
        }
        const data = (await res.json()) as FashionPageContent;
        if (!ignore) {
          setContent(data);
          setSelectedBlockId((current) =>
            data.blocks.some((block) => block.id === current)
              ? current
              : data.blocks[0]?.id ?? "",
          );
          setSaveState("idle");
          setSaveMessage("Đã tải cấu trúc Fashion hiện tại.");
        }
      } catch (error) {
        if (!ignore) {
          setSaveState("error");
          setSaveMessage(
            error instanceof Error ? error.message : "Không tải được dữ liệu",
          );
        }
      }
    }

    loadFashionContent();
    return () => {
      ignore = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function uploadPart(
    url: string,
    blob: Blob,
    onProgress: (loaded: number) => void,
    signal: AbortSignal,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(e.loaded);
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag =
            xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag");
          if (!etag) {
            reject(new Error("Không đọc được ETag. Kiểm tra R2 CORS."));
            return;
          }
          resolve(etag.replace(/^"|"$/g, ""));
        } else {
          reject(new Error(`Upload part failed: HTTP ${xhr.status}`));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Aborted")));
      signal.addEventListener("abort", () => xhr.abort());
      xhr.send(blob);
    });
  }

  async function handleUpload() {
    if (!file) return;

    setUploadError(null);
    setUploadedUrl(null);
    setUploading(true);
    setProgress(0);
    setUploadStatus("Khởi tạo multipart upload...");
    abortRef.current = new AbortController();

    const signal = abortRef.current.signal;
    let init: InitResp;

    try {
      const res = await fetch("/api/admin/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Init failed: ${res.status}`);
      }
      init = (await res.json()) as InitResp;
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Init error");
      setUploading(false);
      return;
    }

    const { key, uploadId, partSize, partUrls } = init;
    const loaded: number[] = new Array(partUrls.length).fill(0);
    const uploadedParts: UploadedPart[] = [];
    const totalSize = file.size;
    let nextIndex = 0;
    let aborted = false;

    const updateOverall = () => {
      const sum = loaded.reduce((total, current) => total + current, 0);
      setProgress(Math.round((sum / totalSize) * 100));
    };

    async function worker() {
      while (!aborted) {
        const idx = nextIndex;
        nextIndex += 1;
        if (idx >= partUrls.length) return;

        const part = partUrls[idx];
        const start = (part.partNumber - 1) * partSize;
        const end = Math.min(start + partSize, totalSize);
        const blob = file!.slice(start, end);

        try {
          const etag = await uploadPart(
            part.url,
            blob,
            (partLoaded) => {
              loaded[idx] = partLoaded;
              updateOverall();
            },
            signal,
          );
          uploadedParts.push({ partNumber: part.partNumber, etag });
          loaded[idx] = end - start;
          updateOverall();
        } catch (error) {
          aborted = true;
          throw error;
        }
      }
    }

    try {
      setUploadStatus(`Uploading ${partUrls.length} part...`);
      const workers = Array.from(
        { length: Math.min(PARALLEL_PARTS, partUrls.length) },
        () => worker(),
      );
      await Promise.all(workers);

      setUploadStatus("Hoàn tất multipart upload...");
      const completeRes = await fetch("/api/admin/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, uploadId, parts: uploadedParts }),
      });
      if (!completeRes.ok) {
        const data = await completeRes.json().catch(() => ({}));
        throw new Error(data?.error ?? `Complete failed: ${completeRes.status}`);
      }
      const data = (await completeRes.json()) as { url: string };
      setUploadedUrl(data.url);
      setUploadStatus("Hoàn tất");
      setProgress(100);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload error");
      try {
        await fetch("/api/admin/upload/abort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, uploadId }),
        });
      } catch {}
      setUploadStatus("Đã hủy");
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  }

  function resetUpload() {
    setFile(null);
    setProgress(0);
    setUploadStatus("");
    setUploadError(null);
    setUploadedUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function saveFashionContent() {
    setSaveState("saving");
    setSaveMessage("Đang lưu cấu trúc Fashion...");

    try {
      const res = await fetch("/api/admin/fashion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Không lưu được cấu trúc Fashion");
      }
      setSaveState("saved");
      setSaveMessage("Đã lưu. Trang /fashion sẽ đọc cấu trúc mới từ R2.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(
        error instanceof Error ? error.message : "Không lưu được dữ liệu",
      );
    }
  }

  function updateContent(patch: Partial<FashionPageContent>) {
    setContent((current) => ({ ...current, ...patch }));
    setSaveState("idle");
  }

  function updateBlock(index: number, patch: Partial<FashionBlock>) {
    setContent((current) => {
      const next = cloneContent(current);
      next.blocks[index] = { ...next.blocks[index], ...patch };
      return next;
    });
    setSaveState("idle");
  }

  function updateItem(
    blockIndex: number,
    itemIndex: number,
    patch: Partial<FashionMediaItem>,
  ) {
    setContent((current) => {
      const next = cloneContent(current);
      const items = next.blocks[blockIndex].items ?? [];
      items[itemIndex] = { ...items[itemIndex], ...patch };
      next.blocks[blockIndex].items = items;
      return next;
    });
    setSaveState("idle");
  }

  function addBlock() {
    const block = createBlock(addType);
    setContent((current) => ({
      ...current,
      blocks: [...current.blocks, block],
    }));
    setSelectedBlockId(block.id);
    setInspectorTab("block");
    setSaveState("idle");
  }

  function duplicateBlock(index: number) {
    const source = content.blocks[index];
    if (!source) return;
    const copy = {
      ...cloneContent({
        version: 1,
        title: content.title,
        description: content.description,
        blocks: [source],
      }).blocks[0],
      id: uid(source.type),
      title: `${source.title} Copy`,
    };
    setContent((current) => {
      const next = cloneContent(current);
      next.blocks.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedBlockId(copy.id);
    setInspectorTab("block");
    setSaveState("idle");
  }

  function removeBlock(index: number) {
    const removed = content.blocks[index];
    const nextSelection =
      content.blocks[index + 1]?.id ?? content.blocks[index - 1]?.id ?? "";
    setContent((current) => ({
      ...current,
      blocks: current.blocks.filter((_, itemIndex) => itemIndex !== index),
    }));
    if (removed?.id === selectedBlockId) {
      setSelectedBlockId(nextSelection);
    }
    setSaveState("idle");
  }

  function moveBlock(from: number, to: number) {
    if (from === to || to < 0 || to >= content.blocks.length) return;
    setContent((current) => {
      const next = cloneContent(current);
      const [moved] = next.blocks.splice(from, 1);
      next.blocks.splice(to, 0, moved);
      return next;
    });
    setSaveState("idle");
  }

  function addItem(blockIndex: number) {
    setContent((current) => {
      const next = cloneContent(current);
      const item =
        next.blocks[blockIndex].type === "reviews"
          ? createReviewItem()
          : createItem();
      next.blocks[blockIndex].items = [
        ...(next.blocks[blockIndex].items ?? []),
        item,
      ];
      return next;
    });
    setSaveState("idle");
  }

  function removeItem(blockIndex: number, itemIndex: number) {
    setContent((current) => {
      const next = cloneContent(current);
      next.blocks[blockIndex].items = (
        next.blocks[blockIndex].items ?? []
      ).filter((_, index) => index !== itemIndex);
      return next;
    });
    setSaveState("idle");
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setUploadError(null);
    setUploadedUrl(null);
    setProgress(0);
    setUploadStatus("");
  }

  function onDropBlock(event: DragEvent<HTMLElement>, index: number) {
    event.preventDefault();
    if (draggedIndex === null) return;
    moveBlock(draggedIndex, index);
    setDraggedIndex(null);
  }

  function renderMediaField(
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) {
    return (
      <Field label={label}>
        <div className={styles.inlineField}>
          <input value={value} onChange={(event) => onChange(event.target.value)} />
          <button
            type="button"
            disabled={!uploadedUrl}
            onClick={() => uploadedUrl && onChange(uploadedUrl)}
          >
            Use upload
          </button>
        </div>
      </Field>
    );
  }

  function renderMediaPanel() {
    return (
      <div className={styles.inspectorSection}>
        <h2>Media Library</h2>
        <p>
          Upload image/video to R2. Use the resulting URL in any selected block.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          disabled={uploading}
          onChange={onFileChange}
          className={styles.hiddenInput}
        />
        <button
          type="button"
          className={styles.dropButton}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {file ? (
            <>
              <strong>{file.name}</strong>
              <span>
                {sizeMB} MB | {file.type || "unknown type"}
              </span>
            </>
          ) : (
            <>
              <strong>Select media</strong>
              <span>Images and videos up to 5 GB</span>
            </>
          )}
        </button>
        {uploading && (
          <div className={styles.progressShell}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p>
              {progress}% | {uploadStatus}
            </p>
          </div>
        )}
        {uploadError && <p className={styles.error}>Lỗi: {uploadError}</p>}
        {uploadedUrl && (
          <div className={styles.uploadResult}>
            <span>Latest upload</span>
            <a href={uploadedUrl} target="_blank" rel="noreferrer">
              {uploadedUrl}
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(uploadedUrl)}
            >
              Copy URL
            </button>
          </div>
        )}
        <div className={styles.buttonRow}>
          {!uploading && (
            <button type="button" onClick={handleUpload} disabled={!file}>
              Upload
            </button>
          )}
          {uploading && (
            <button type="button" onClick={() => abortRef.current?.abort()}>
              Cancel
            </button>
          )}
          {(uploadedUrl || uploadError) && (
            <button type="button" onClick={resetUpload}>
              Reset
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderSettingsPanel() {
    return (
      <div className={styles.inspectorSection}>
        <h2>Page Settings</h2>
        <Field label="Page title">
          <input
            value={content.title}
            onChange={(event) => updateContent({ title: event.target.value })}
          />
        </Field>
        <Field label="Meta description">
          <textarea
            rows={5}
            value={content.description}
            onChange={(event) =>
              updateContent({ description: event.target.value })
            }
          />
        </Field>
        <button
          type="button"
          className={styles.fullWidthButton}
          onClick={() => {
            setContent(cloneContent(defaultFashionPageContent));
            setSelectedBlockId(defaultFashionPageContent.blocks[0]?.id ?? "");
            setSaveState("idle");
            setSaveMessage("Đã reset về nội dung mặc định. Bấm Save để lưu.");
          }}
        >
          Reset to defaults
        </button>
      </div>
    );
  }

  function renderAddPanel() {
    return (
      <div className={styles.inspectorSection}>
        <h2>Add Block</h2>
        <p>Choose a content block and add it to the bottom of the page.</p>
        <Field label="Block type">
          <select
            value={addType}
            onChange={(event) =>
              setAddType(event.target.value as FashionBlockType)
            }
          >
            {fashionBlockTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <button type="button" className={styles.fullWidthButton} onClick={addBlock}>
          Add block
        </button>
      </div>
    );
  }

  function renderBlockInspector() {
    if (!selectedBlock || selectedBlockIndex < 0) {
      return (
        <div className={styles.inspectorSection}>
          <h2>No block selected</h2>
          <p>Select a block from the canvas to edit it.</p>
        </div>
      );
    }

    const block = selectedBlock;
    return (
      <div className={styles.inspectorSection}>
        <div className={styles.inspectorHeader}>
          <div>
            <span>{block.type}</span>
            <h2>{block.title || "Untitled block"}</h2>
          </div>
          <div className={styles.miniActions}>
            <button
              type="button"
              onClick={() => moveBlock(selectedBlockIndex, selectedBlockIndex - 1)}
              disabled={selectedBlockIndex === 0}
            >
              Up
            </button>
            <button
              type="button"
              onClick={() => moveBlock(selectedBlockIndex, selectedBlockIndex + 1)}
              disabled={selectedBlockIndex === content.blocks.length - 1}
            >
              Down
            </button>
          </div>
        </div>

        <div className={styles.fieldStack}>
          <Field label="Type">
            <select
              value={block.type}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, {
                  type: event.target.value as FashionBlockType,
                })
              }
            >
              {fashionBlockTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kicker">
            <input
              value={block.kicker ?? ""}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { kicker: event.target.value })
              }
            />
          </Field>
          <Field label="Title">
            <input
              value={block.title}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { title: event.target.value })
              }
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={block.subtitle ?? ""}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { subtitle: event.target.value })
              }
            />
          </Field>
          <Field label="Body">
            <textarea
              rows={5}
              value={block.body ?? ""}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { body: event.target.value })
              }
            />
          </Field>
          {renderMediaField("Media URL", block.mediaUrl ?? "", (value) =>
            updateBlock(selectedBlockIndex, { mediaUrl: value }),
          )}
          <Field label="Media kind">
            <select
              value={block.mediaKind ?? "image"}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, {
                  mediaKind: event.target.value as "image" | "video",
                })
              }
            >
              <option value="image">image</option>
              <option value="video">video</option>
            </select>
          </Field>
          <Field label="Poster URL">
            <input
              value={block.posterUrl ?? ""}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { posterUrl: event.target.value })
              }
            />
          </Field>
          <Field label="Popup video URL">
            <input
              value={block.videoUrl ?? ""}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { videoUrl: event.target.value })
              }
            />
          </Field>
          <Field label="CTA label">
            <input
              value={block.ctaLabel ?? ""}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { ctaLabel: event.target.value })
              }
            />
          </Field>
          <Field label="CTA href">
            <input
              value={block.ctaHref ?? ""}
              onChange={(event) =>
                updateBlock(selectedBlockIndex, { ctaHref: event.target.value })
              }
            />
          </Field>
        </div>

        {supportsItems(block.type) && (
          <div className={styles.itemsPanel}>
            <div className={styles.itemsHeader}>
              <h3>{block.type === "reviews" ? "Reviews" : "Items"}</h3>
              <button type="button" onClick={() => addItem(selectedBlockIndex)}>
                {block.type === "reviews" ? "Add review" : "Add item"}
              </button>
            </div>
            {(block.items ?? []).map((item, itemIndex) => (
              <div key={item.id} className={styles.itemEditor}>
                <div className={styles.itemEditorHeader}>
                  <strong>Item {itemIndex + 1}</strong>
                  <button
                    type="button"
                    onClick={() => removeItem(selectedBlockIndex, itemIndex)}
                  >
                    Remove
                  </button>
                </div>
                <Field
                  label={block.type === "reviews" ? "Reviewer name" : "Title"}
                >
                  <input
                    value={item.title}
                    onChange={(event) =>
                      updateItem(selectedBlockIndex, itemIndex, {
                        title: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field
                  label={block.type === "reviews" ? "Review quote" : "Subtitle"}
                >
                  <textarea
                    rows={block.type === "reviews" ? 4 : 2}
                    value={item.subtitle ?? ""}
                    onChange={(event) =>
                      updateItem(selectedBlockIndex, itemIndex, {
                        subtitle: event.target.value,
                      })
                    }
                  />
                </Field>
                {block.type === "reviews" ? (
                  <Field label="Role or company">
                    <input
                      value={item.meta ?? ""}
                      onChange={(event) =>
                        updateItem(selectedBlockIndex, itemIndex, {
                          meta: event.target.value,
                        })
                      }
                    />
                  </Field>
                ) : (
                  <>
                    {renderMediaField("Media URL", item.mediaUrl, (value) =>
                      updateItem(selectedBlockIndex, itemIndex, {
                        mediaUrl: value,
                      }),
                    )}
                    <div className={styles.twoColumns}>
                      <Field label="Media kind">
                        <select
                          value={item.mediaKind}
                          onChange={(event) =>
                            updateItem(selectedBlockIndex, itemIndex, {
                              mediaKind: event.target.value as "image" | "video",
                            })
                          }
                        >
                          <option value="image">image</option>
                          <option value="video">video</option>
                        </select>
                      </Field>
                      <Field label="Aspect">
                        <select
                          value={item.aspect ?? "portrait"}
                          onChange={(event) =>
                            updateItem(selectedBlockIndex, itemIndex, {
                              aspect: event.target.value as
                                | "portrait"
                                | "landscape"
                                | "square",
                            })
                          }
                        >
                          <option value="portrait">portrait</option>
                          <option value="landscape">landscape</option>
                          <option value="square">square</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Href">
                      <input
                        value={item.href ?? ""}
                        onChange={(event) =>
                          updateItem(selectedBlockIndex, itemIndex, {
                            href: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Popup video URL">
                      <input
                        value={item.videoUrl ?? ""}
                        onChange={(event) =>
                          updateItem(selectedBlockIndex, itemIndex, {
                            videoUrl: event.target.value,
                          })
                        }
                      />
                    </Field>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.dangerZone}>
          <button type="button" onClick={() => duplicateBlock(selectedBlockIndex)}>
            Duplicate block
          </button>
          <button type="button" onClick={() => removeBlock(selectedBlockIndex)}>
            Delete block
          </button>
        </div>
      </div>
    );
  }

  function renderInspector() {
    if (inspectorTab === "add") return renderAddPanel();
    if (inspectorTab === "media") return renderMediaPanel();
    if (inspectorTab === "settings") return renderSettingsPanel();
    return renderBlockInspector();
  }

  return (
    <main className={styles.page}>
      <aside className={styles.wpSidebar}>
        <Link href="/" className={styles.wpLogo}>
          20s<span>Creative</span>
        </Link>
        <nav className={styles.wpNav} aria-label="Admin sections">
          <button
            type="button"
            className={inspectorTab === "block" ? styles.navActive : ""}
            onClick={() => setInspectorTab("block")}
          >
            Editor
          </button>
          <button
            type="button"
            className={inspectorTab === "add" ? styles.navActive : ""}
            onClick={() => setInspectorTab("add")}
          >
            Add Block
          </button>
          <button
            type="button"
            className={inspectorTab === "media" ? styles.navActive : ""}
            onClick={() => setInspectorTab("media")}
          >
            Media
          </button>
          <button
            type="button"
            className={inspectorTab === "settings" ? styles.navActive : ""}
            onClick={() => setInspectorTab("settings")}
          >
            Settings
          </button>
        </nav>
        <div className={styles.wpSidebarFooter}>
          <a href="/fashion" target="_blank" rel="noreferrer">
            View site
          </a>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Fashion page</p>
            <h1>WordPress-style builder</h1>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.saveStatus} data-state={saveState}>
              {saveMessage || "Ready"}
            </span>
            <a href="/fashion" target="_blank" rel="noreferrer">
              Preview
            </a>
            <button
              type="button"
              onClick={saveFashionContent}
              disabled={saveState === "saving" || saveState === "loading"}
            >
              {saveState === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </header>

        <div className={styles.editorLayout}>
          <section className={styles.canvasPane}>
            <div className={styles.canvasHeader}>
              <div>
                <h2>Page Structure</h2>
                <p>Drag blocks to reorder. Select a block to edit it.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectorTab("add");
                }}
              >
                Add block
              </button>
            </div>

            <div className={styles.blockList}>
              {content.blocks.map((block, blockIndex) => (
                <article
                  key={block.id}
                  className={`${styles.canvasBlock} ${
                    block.id === selectedBlockId ? styles.canvasBlockActive : ""
                  }`}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setInspectorTab("block");
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDropBlock(event, blockIndex)}
                >
                  <button
                    type="button"
                    draggable
                    className={styles.dragHandle}
                    onDragStart={() => setDraggedIndex(blockIndex)}
                    onDragEnd={() => setDraggedIndex(null)}
                    aria-label={`Drag block ${blockIndex + 1}`}
                  >
                    ::
                  </button>
                  <div className={styles.blockPreview}>
                    {block.mediaUrl && block.mediaKind !== "video" ? (
                      <img src={block.mediaUrl} alt="" />
                    ) : (
                      <span>{block.type}</span>
                    )}
                  </div>
                  <div className={styles.blockSummary}>
                    <span>
                      {String(blockIndex + 1).padStart(2, "0")} | {block.type}
                    </span>
                    <h3>{block.title || "Untitled block"}</h3>
                    {block.subtitle && <p>{block.subtitle}</p>}
                  </div>
                  <div className={styles.blockQuickActions}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveBlock(blockIndex, blockIndex - 1);
                      }}
                      disabled={blockIndex === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveBlock(blockIndex, blockIndex + 1);
                      }}
                      disabled={blockIndex === content.blocks.length - 1}
                    >
                      Down
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className={styles.inspectorPane}>{renderInspector()}</aside>
        </div>
      </section>
    </main>
  );
}
