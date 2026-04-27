"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FashionEditorialPage from "@/components/FashionEditorialPage";
import { isLegacyPageSlug } from "@/data/legacyPageContent";
import {
  fashionAligns,
  fashionBlockTypes,
  fashionSpacerSizes,
  fashionThemes,
  fashionVerticalAligns,
  type FashionAlign,
  type FashionBlock,
  type FashionBlockType,
  type FashionDuoColumn,
  type FashionLayout,
  type FashionMediaItem,
  type FashionPageContent,
  type FashionSpacerSize,
  type FashionTheme,
  type FashionVerticalAlign,
} from "@/data/fashionPage";
import {
  editablePages,
  getDefaultPageContent,
  type EditablePageSlug,
} from "@/data/pageContent";
import LegacyPageEditor from "./LegacyPageEditor";
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
type LeftPanel = "blocks" | "add" | "media" | "settings";
type DeviceMode = "desktop" | "tablet" | "mobile";

const PARALLEL_PARTS = 4;

const DEVICE_WIDTHS: Record<DeviceMode, number | null> = {
  desktop: null,
  tablet: 900,
  mobile: 414,
};

const BLOCK_TYPE_LABELS: Record<FashionBlockType, string> = {
  hero: "Hero",
  statement: "Statement",
  textIntro: "Text intro",
  feature: "Feature split",
  lookFeature: "Look feature",
  mediaPair: "Media pair",
  editorialDuo: "Editorial duo",
  carousel: "Carousel",
  lookbook: "Lookbook",
  lookbookLandscape: "Lookbook (landscape)",
  videoTeaser: "Video teaser",
  projectGrid: "Project grid",
  worldGrid: "World grid",
  reviews: "Reviews",
  spacer: "Spacer",
  cta: "CTA",
};

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
    title: "New item",
    subtitle: "",
    mediaUrl: "",
    mediaKind: "image",
    streamUid: "",
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
    streamUid: "",
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
    streamUid: "",
    ctaLabel: "",
    ctaHref: "",
    theme: "light",
  };

  if (type === "hero" || type === "videoTeaser" || type === "cta") {
    return { ...base, theme: "dark" };
  }

  if (type === "lookFeature") {
    return {
      ...base,
      kicker: "Look 0",
      title: "New look",
      lookNumber: "Look 00",
      fullBleed: true,
    };
  }

  if (type === "mediaPair") {
    return {
      ...base,
      title: "Two chapter spread",
      items: [createItem(), createItem()],
    };
  }

  if (type === "editorialDuo") {
    return {
      ...base,
      title: "Push looks",
      kicker: "Look",
      ctaLabel: "Khám phá các thiết kế",
      ctaHref: "#",
      items: [
        {
          ...createItem(),
          column: "left",
          verticalAlign: "top",
          showPlus: true,
        },
        {
          ...createItem(),
          column: "right",
          verticalAlign: "bottom",
          showPlus: true,
        },
      ],
    };
  }

  if (type === "carousel" || type === "projectGrid") {
    return { ...base, items: [createItem()] };
  }

  if (type === "lookbook" || type === "lookbookLandscape") {
    const isLandscape = type === "lookbookLandscape";
    const newItems = [createItem(), createItem(), createItem()].map((it) => ({
      ...it,
      aspect: isLandscape ? ("landscape" as const) : ("portrait" as const),
      captionPosition: "overlay" as const,
    }));
    return {
      ...base,
      title: isLandscape ? "New landscape lookbook" : "New lookbook",
      kicker: "Lookbook",
      autoplay: true,
      showPeek: true,
      items: newItems,
    };
  }

  if (type === "worldGrid") {
    return {
      ...base,
      title: "World",
      items: [createItem(), createItem(), createItem(), createItem()],
    };
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

  if (type === "spacer") {
    return { ...base, title: "Spacer", spacerSize: "md" };
  }

  if (type === "textIntro") {
    return { ...base, title: "Editorial note", align: "center" };
  }

  return base;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
      {hint && <em>{hint}</em>}
    </label>
  );
}


function supportsItems(type: FashionBlockType) {
  return (
    type === "mediaPair" ||
    type === "editorialDuo" ||
    type === "carousel" ||
    type === "lookbook" ||
    type === "lookbookLandscape" ||
    type === "projectGrid" ||
    type === "worldGrid" ||
    type === "reviews"
  );
}

function blockSupportsMedia(type: FashionBlockType) {
  return (
    type === "hero" ||
    type === "feature" ||
    type === "lookFeature" ||
    type === "videoTeaser" ||
    type === "cta"
  );
}

function blockSupportsBody(type: FashionBlockType) {
  return (
    type === "statement" ||
    type === "textIntro" ||
    type === "feature" ||
    type === "cta"
  );
}

function blockSupportsCta(type: FashionBlockType) {
  return type !== "spacer" && type !== "reviews";
}

export default function AdminUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [activePage, setActivePage] = useState<EditablePageSlug>("fashion");
  const [content, setContent] = useState<FashionPageContent>(
    () => getDefaultPageContent("fashion"),
  );
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [saveMessage, setSaveMessage] = useState("");
  const [addType, setAddType] = useState<FashionBlockType>("lookFeature");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    getDefaultPageContent("fashion").blocks[0]?.id ?? null,
  );
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("blocks");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [selectedSubTarget, setSelectedSubTarget] = useState<string | null>(
    null,
  );

  const selectedBlockIndex = useMemo(
    () =>
      content.blocks.findIndex((block) => block.id === selectedBlockId),
    [content.blocks, selectedBlockId],
  );
  const selectedBlock =
    selectedBlockIndex >= 0 ? content.blocks[selectedBlockIndex] : null;
  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;
  const deviceWidth = DEVICE_WIDTHS[device];
  const activePageMeta =
    editablePages.find((page) => page.slug === activePage) ?? editablePages[0];

  useEffect(() => {
    if (isLegacyPageSlug(activePage)) return;

    let ignore = false;
    async function loadPageContent() {
      setSaveState("loading");
      setSelectedBlockId(null);
      setSelectedSubTarget(null);
      try {
        const res = await fetch(`/api/admin/pages/${activePage}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "Không tải được cấu trúc trang");
        }
        const data = (await res.json()) as FashionPageContent;
        if (!ignore) {
          setContent(data);
          setSelectedBlockId(data.blocks[0]?.id ?? null);
          setSaveState("idle");
          setSaveMessage(`Đã tải cấu trúc ${activePageMeta.label}.`);
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

    loadPageContent();
    return () => {
      ignore = true;
    };
  }, [activePage, activePageMeta.label]);

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
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) onProgress(event.loaded);
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

  async function savePageContent() {
    setSaveState("saving");
    setSaveMessage(`Đang lưu cấu trúc ${activePageMeta.label}...`);

    try {
      const res = await fetch(`/api/admin/pages/${activePage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Không lưu được cấu trúc trang");
      }
      setSaveState("saved");
      setSaveMessage(
        `Đã lưu. Mở ${activePageMeta.href} ở tab khác để xem kết quả.`,
      );
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

  function updateBlockLayoutByid(
    blockId: string,
    key: "layout" | "mediaLayout" | "textLayout",
    next: FashionLayout,
  ) {
    setContent((current) => {
      const blockIndex = current.blocks.findIndex((b) => b.id === blockId);
      if (blockIndex < 0) return current;
      const nextContent = cloneContent(current);
      nextContent.blocks[blockIndex] = {
        ...nextContent.blocks[blockIndex],
        [key]: next,
      };
      return nextContent;
    });
    setSaveState("idle");
  }

  function updateItemLayoutById(
    blockId: string,
    itemId: string,
    key: "layout" | "mediaLayout",
    next: FashionLayout,
  ) {
    setContent((current) => {
      const blockIndex = current.blocks.findIndex((b) => b.id === blockId);
      if (blockIndex < 0) return current;
      const nextContent = cloneContent(current);
      const items = nextContent.blocks[blockIndex].items ?? [];
      const itemIndex = items.findIndex((item) => item.id === itemId);
      if (itemIndex < 0) return current;
      items[itemIndex] = { ...items[itemIndex], [key]: next };
      nextContent.blocks[blockIndex].items = items;
      return nextContent;
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
    setLeftPanel("blocks");
    setSaveState("idle");
  }

  function duplicateBlock(index: number) {
    const source = content.blocks[index];
    if (!source) return;
    const copy: FashionBlock = {
      ...cloneContent({
        version: 1,
        title: content.title,
        description: content.description,
        blocks: [source],
      }).blocks[0],
      id: uid(source.type),
    };
    if (Array.isArray(copy.items)) {
      copy.items = copy.items.map((item) => ({ ...item, id: uid("item") }));
    }
    setContent((current) => {
      const next = cloneContent(current);
      next.blocks.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedBlockId(copy.id);
    setSaveState("idle");
  }

  function removeBlock(index: number) {
    const removed = content.blocks[index];
    const nextSelection =
      content.blocks[index + 1]?.id ?? content.blocks[index - 1]?.id ?? null;
    setContent((current) => ({
      ...current,
      blocks: current.blocks.filter((_, idx) => idx !== index),
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

  function reorderByDrop(targetIndex: number) {
    if (!draggingBlockId) return;
    const fromIndex = content.blocks.findIndex(
      (block) => block.id === draggingBlockId,
    );
    if (fromIndex < 0) return;
    moveBlock(fromIndex, targetIndex);
    setDraggingBlockId(null);
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
      ).filter((_, idx) => idx !== itemIndex);
      return next;
    });
    setSaveState("idle");
  }

  function moveItem(blockIndex: number, from: number, to: number) {
    setContent((current) => {
      const next = cloneContent(current);
      const items = next.blocks[blockIndex].items ?? [];
      if (to < 0 || to >= items.length) return next;
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      next.blocks[blockIndex].items = items;
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

  function applyUploadedUrl(setter: (value: string) => void) {
    if (uploadedUrl) setter(uploadedUrl);
  }

  function renderMediaField(
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) {
    return (
      <Field label={label}>
        <div className={styles.inlineField}>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://"
          />
          <button
            type="button"
            disabled={!uploadedUrl}
            onClick={() => applyUploadedUrl(onChange)}
            title={uploadedUrl ? "Use last upload URL" : "Upload first"}
          >
            Use upload
          </button>
        </div>
      </Field>
    );
  }

  function renderBlocksPanel() {
    return (
      <div className={styles.leftPanelInner}>
        <div className={styles.leftPanelHeader}>
          <h3>Blocks</h3>
          <span>{content.blocks.length}</span>
        </div>
        <div className={styles.blockList}>
          {content.blocks.map((block, index) => {
            const selectBlock = () => {
              setSelectedBlockId(block.id);
              if (typeof document !== "undefined") {
                const node = document.getElementById(block.id);
                node?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            };
            return (
              <div
                key={block.id}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={() => setDraggingBlockId(block.id)}
                onDragEnd={() => setDraggingBlockId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  reorderByDrop(index);
                }}
                className={`${styles.blockListItem} ${
                  block.id === selectedBlockId ? styles.blockListItemActive : ""
                }`}
                onClick={selectBlock}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectBlock();
                  }
                }}
              >
                <span className={styles.blockListIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.blockListBody}>
                  <strong>
                    {BLOCK_TYPE_LABELS[block.type as FashionBlockType] ??
                      block.type}
                  </strong>
                  <em>{block.title || "Untitled"}</em>
                </span>
                <span className={styles.blockListActions}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveBlock(index, index - 1);
                    }}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveBlock(index, index + 1);
                    }}
                    disabled={index === content.blocks.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </span>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.fullWidthButton}
          onClick={() => setLeftPanel("add")}
        >
          + Add new block
        </button>
      </div>
    );
  }

  function renderAddPanel() {
    return (
      <div className={styles.leftPanelInner}>
        <div className={styles.leftPanelHeader}>
          <h3>Add block</h3>
        </div>
        <p className={styles.muted}>
          Chọn loại block, sau đó bấm Add để thêm vào cuối trang.
        </p>
        <div className={styles.blockTypeGrid}>
          {fashionBlockTypes.map((type) => (
            <button
              type="button"
              key={type}
              className={`${styles.blockTypeCard} ${
                addType === type ? styles.blockTypeCardActive : ""
              }`}
              onClick={() => setAddType(type)}
            >
              <strong>{BLOCK_TYPE_LABELS[type]}</strong>
              <em>{type}</em>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.fullWidthButton}
          onClick={addBlock}
        >
          + Add {BLOCK_TYPE_LABELS[addType]}
        </button>
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => setLeftPanel("blocks")}
        >
          ← Back to blocks
        </button>
      </div>
    );
  }

  function renderMediaPanel() {
    return (
      <div className={styles.leftPanelInner}>
        <div className={styles.leftPanelHeader}>
          <h3>Media library</h3>
        </div>
        <p className={styles.muted}>
          Upload image/video to R2, copy the URL into any block.
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
                {sizeMB} MB • {file.type || "unknown type"}
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
              {progress}% • {uploadStatus}
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
      <div className={styles.leftPanelInner}>
        <div className={styles.leftPanelHeader}>
          <h3>Page settings</h3>
        </div>
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
            const fresh = cloneContent(getDefaultPageContent(activePage));
            setContent(fresh);
            setSelectedBlockId(fresh.blocks[0]?.id ?? null);
            setSelectedSubTarget(null);
            setSaveState("idle");
            setSaveMessage(
              `Đã reset ${activePageMeta.label} về cấu trúc mặc định. Bấm Save để lưu.`,
            );
          }}
        >
          Reset to defaults
        </button>
      </div>
    );
  }

  function renderInspector() {
    if (!selectedBlock || selectedBlockIndex < 0) {
      return (
        <div className={styles.inspectorEmpty}>
          <h3>Chưa chọn block</h3>
          <p>Click vào block bất kỳ trên preview để chỉnh.</p>
        </div>
      );
    }

    const block = selectedBlock;
    const idx = selectedBlockIndex;

    return (
      <>
        <header className={styles.inspectorHeader}>
          <div>
            <span className={styles.inspectorEyebrow}>
              {String(idx + 1).padStart(2, "0")} •{" "}
              {BLOCK_TYPE_LABELS[block.type as FashionBlockType] ?? block.type}
            </span>
            <h3>{block.title || "Untitled"}</h3>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setSelectedBlockId(null)}
            aria-label="Đóng"
          >
            ×
          </button>
        </header>

        <div className={styles.inspectorBody}>
          <Field label="Type">
            <select
              value={block.type}
              onChange={(event) =>
                updateBlock(idx, {
                  type: event.target.value as FashionBlockType,
                })
              }
            >
              {fashionBlockTypes.map((type) => (
                <option key={type} value={type}>
                  {BLOCK_TYPE_LABELS[type]} ({type})
                </option>
              ))}
            </select>
          </Field>

          {block.type !== "spacer" && (
            <>
              <Field label="Kicker">
                <input
                  value={block.kicker ?? ""}
                  onChange={(event) =>
                    updateBlock(idx, { kicker: event.target.value })
                  }
                />
              </Field>
              <Field label="Title">
                <input
                  value={block.title}
                  onChange={(event) =>
                    updateBlock(idx, { title: event.target.value })
                  }
                />
              </Field>
              <Field label="Subtitle">
                <input
                  value={block.subtitle ?? ""}
                  onChange={(event) =>
                    updateBlock(idx, { subtitle: event.target.value })
                  }
                />
              </Field>
            </>
          )}

          {blockSupportsBody(block.type) && (
            <Field label="Body text">
              <textarea
                rows={5}
                value={block.body ?? ""}
                onChange={(event) =>
                  updateBlock(idx, { body: event.target.value })
                }
              />
            </Field>
          )}

          {block.type === "lookFeature" && (
            <Field label="Look number" hint="Hiện ở góc trên ảnh">
              <input
                value={block.lookNumber ?? ""}
                onChange={(event) =>
                  updateBlock(idx, { lookNumber: event.target.value })
                }
              />
            </Field>
          )}

          {(block.type === "lookbook" ||
            block.type === "lookbookLandscape") && (
            <div className={styles.twoColumns}>
              <Field label="Show peek" hint="Lộ slide kế bên 2 mép">
                <select
                  value={block.showPeek === false ? "no" : "yes"}
                  onChange={(event) =>
                    updateBlock(idx, {
                      showPeek: event.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
              <Field
                label="Autoplay"
                hint="Lookbook luôn autoplay 3s, pause khi hover"
              >
                <select value="yes" disabled>
                  <option value="yes">Yes (always)</option>
                </select>
              </Field>
            </div>
          )}

          {block.type === "spacer" && (
            <Field label="Spacer size">
              <select
                value={block.spacerSize ?? "md"}
                onChange={(event) =>
                  updateBlock(idx, {
                    spacerSize: event.target.value as FashionSpacerSize,
                  })
                }
              >
                {fashionSpacerSizes.map((size) => (
                  <option key={size} value={size}>
                    {size.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {(block.type === "textIntro" || block.type === "statement") && (
            <Field label="Text alignment">
              <select
                value={block.align ?? "center"}
                onChange={(event) =>
                  updateBlock(idx, {
                    align: event.target.value as FashionAlign,
                  })
                }
              >
                {fashionAligns.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Theme">
            <select
              value={block.theme ?? "light"}
              onChange={(event) =>
                updateBlock(idx, {
                  theme: event.target.value as FashionTheme,
                })
              }
            >
              {fashionThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </Field>

          {blockSupportsMedia(block.type) && (
            <>
              {renderMediaField("Media URL", block.mediaUrl ?? "", (value) =>
                updateBlock(idx, { mediaUrl: value }),
              )}
              <div className={styles.twoColumns}>
                <Field label="Media kind">
                  <select
                    value={block.mediaKind ?? "image"}
                    onChange={(event) =>
                      updateBlock(idx, {
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
                      updateBlock(idx, { posterUrl: event.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Popup video URL">
                <input
                  value={block.videoUrl ?? ""}
                  onChange={(event) =>
                    updateBlock(idx, { videoUrl: event.target.value })
                  }
                />
              </Field>
              <Field label="Cloudflare Stream UID" hint="Ưu tiên UID này cho autoplay/popup. Media URL và Popup video URL vẫn giữ làm fallback.">
                <input
                  value={block.streamUid ?? ""}
                  onChange={(event) =>
                    updateBlock(idx, { streamUid: event.target.value })
                  }
                  placeholder="Ví dụ: 6b9e68b07dfee8cc2d116e4c51d6a957"
                />
              </Field>
            </>
          )}

          {blockSupportsCta(block.type) && (
            <div className={styles.twoColumns}>
              <Field label="CTA label">
                <input
                  value={block.ctaLabel ?? ""}
                  onChange={(event) =>
                    updateBlock(idx, { ctaLabel: event.target.value })
                  }
                />
              </Field>
              <Field label="CTA href">
                <input
                  value={block.ctaHref ?? ""}
                  onChange={(event) =>
                    updateBlock(idx, { ctaHref: event.target.value })
                  }
                />
              </Field>
            </div>
          )}

          {supportsItems(block.type) && (
            <div className={styles.itemsPanel}>
              <div className={styles.itemsHeader}>
                <h4>{block.type === "reviews" ? "Reviews" : "Items"}</h4>
                <button type="button" onClick={() => addItem(idx)}>
                  + Add
                </button>
              </div>
              {(block.items ?? []).map((item, itemIndex) => (
                <details key={item.id} className={styles.itemEditor} open>
                  <summary>
                    <strong>
                      {String(itemIndex + 1).padStart(2, "0")} •{" "}
                      {item.title || "Untitled"}
                    </strong>
                    <span className={styles.itemEditorActions}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          moveItem(idx, itemIndex, itemIndex - 1);
                        }}
                        disabled={itemIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          moveItem(idx, itemIndex, itemIndex + 1);
                        }}
                        disabled={
                          itemIndex === (block.items?.length ?? 0) - 1
                        }
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          removeItem(idx, itemIndex);
                        }}
                      >
                        ×
                      </button>
                    </span>
                  </summary>
                  <Field
                    label={
                      block.type === "reviews" ? "Reviewer name" : "Title"
                    }
                  >
                    <input
                      value={item.title}
                      onChange={(event) =>
                        updateItem(idx, itemIndex, {
                          title: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field
                    label={
                      block.type === "reviews" ? "Review quote" : "Subtitle"
                    }
                  >
                    <textarea
                      rows={block.type === "reviews" ? 4 : 2}
                      value={item.subtitle ?? ""}
                      onChange={(event) =>
                        updateItem(idx, itemIndex, {
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
                          updateItem(idx, itemIndex, {
                            meta: event.target.value,
                          })
                        }
                      />
                    </Field>
                  ) : (
                    <>
                      {(block.type === "lookbook" ||
                        block.type === "lookbookLandscape") && (
                        <Field label="Look number">
                          <input
                            value={item.lookNumber ?? ""}
                            onChange={(event) =>
                              updateItem(idx, itemIndex, {
                                lookNumber: event.target.value,
                              })
                            }
                          />
                        </Field>
                      )}
                      {block.type === "editorialDuo" && (
                        <>
                          <div className={styles.twoColumns}>
                            <Field label="Column">
                              <select
                                value={item.column ?? "left"}
                                onChange={(event) =>
                                  updateItem(idx, itemIndex, {
                                    column: event.target
                                      .value as FashionDuoColumn,
                                  })
                                }
                              >
                                <option value="left">left</option>
                                <option value="right">right</option>
                              </select>
                            </Field>
                            <Field label="Vertical align">
                              <select
                                value={item.verticalAlign ?? "center"}
                                onChange={(event) =>
                                  updateItem(idx, itemIndex, {
                                    verticalAlign: event.target
                                      .value as FashionVerticalAlign,
                                  })
                                }
                              >
                                {fashionVerticalAligns.map((value) => (
                                  <option key={value} value={value}>
                                    {value}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>
                          <Field
                            label="Show + button"
                            hint="Hiển thị nút tròn + góc ảnh để mở video"
                          >
                            <select
                              value={item.showPlus === false ? "no" : "yes"}
                              onChange={(event) =>
                                updateItem(idx, itemIndex, {
                                  showPlus: event.target.value === "yes",
                                })
                              }
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </Field>
                        </>
                      )}
                      {renderMediaField(
                        "Media URL",
                        item.mediaUrl,
                        (value) =>
                          updateItem(idx, itemIndex, { mediaUrl: value }),
                      )}
                      <div className={styles.twoColumns}>
                        <Field label="Media kind">
                          <select
                            value={item.mediaKind}
                            onChange={(event) =>
                              updateItem(idx, itemIndex, {
                                mediaKind: event.target.value as
                                  | "image"
                                  | "video",
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
                              updateItem(idx, itemIndex, {
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
                      <Field label="Href (link)">
                        <input
                          value={item.href ?? ""}
                          onChange={(event) =>
                            updateItem(idx, itemIndex, {
                              href: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="Popup video URL">
                        <input
                          value={item.videoUrl ?? ""}
                          onChange={(event) =>
                            updateItem(idx, itemIndex, {
                              videoUrl: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="Cloudflare Stream UID" hint="Ưu tiên UID này cho autoplay/popup. Media URL và Popup video URL vẫn giữ làm fallback.">
                        <input
                          value={item.streamUid ?? ""}
                          onChange={(event) =>
                            updateItem(idx, itemIndex, {
                              streamUid: event.target.value,
                            })
                          }
                          placeholder="Ví dụ: 6b9e68b07dfee8cc2d116e4c51d6a957"
                        />
                      </Field>
                    </>
                  )}
                </details>
              ))}
            </div>
          )}
        </div>

        <footer className={styles.inspectorFooter}>
          <button type="button" onClick={() => duplicateBlock(idx)}>
            Duplicate
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => removeBlock(idx)}
          >
            Delete
          </button>
        </footer>
      </>
    );
  }

  function renderLeftPanel() {
    if (leftPanel === "add") return renderAddPanel();
    if (leftPanel === "media") return renderMediaPanel();
    if (leftPanel === "settings") return renderSettingsPanel();
    return renderBlocksPanel();
  }

  if (isLegacyPageSlug(activePage)) {
    return (
      <LegacyPageEditor
        key={activePage}
        activePage={activePage}
        onActivePageChange={setActivePage}
        onLogout={logout}
      />
    );
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.leftRail}>
        <Link href="/" className={styles.logo}>
          20s<em>creative</em>
        </Link>
        <div className={styles.pageSwitcher}>
          <span>Editing page</span>
          <select
            value={activePage}
            onChange={(event) => {
              setActivePage(event.target.value as EditablePageSlug);
              setLeftPanel("blocks");
            }}
            aria-label="Choose page to edit"
          >
            {editablePages.map((page) => (
              <option key={page.slug} value={page.slug}>
                {page.label}
              </option>
            ))}
          </select>
        </div>
        <nav className={styles.tabNav} aria-label="Sections">
          <button
            type="button"
            className={leftPanel === "blocks" ? styles.tabActive : ""}
            onClick={() => setLeftPanel("blocks")}
          >
            Blocks
          </button>
          <button
            type="button"
            className={leftPanel === "add" ? styles.tabActive : ""}
            onClick={() => setLeftPanel("add")}
          >
            Add
          </button>
          <button
            type="button"
            className={leftPanel === "media" ? styles.tabActive : ""}
            onClick={() => setLeftPanel("media")}
          >
            Media
          </button>
          <button
            type="button"
            className={leftPanel === "settings" ? styles.tabActive : ""}
            onClick={() => setLeftPanel("settings")}
          >
            Settings
          </button>
        </nav>
        <div className={styles.leftPanel}>{renderLeftPanel()}</div>
        <div className={styles.railFooter}>
          <a href={activePageMeta.href} target="_blank" rel="noreferrer">
            View site →
          </a>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <section className={styles.canvas}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <p>{activePageMeta.label} page</p>
            <h1>Visual editor</h1>
          </div>
          <div className={styles.deviceSwitcher}>
            {(Object.keys(DEVICE_WIDTHS) as DeviceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={device === mode ? styles.deviceActive : ""}
                onClick={() => setDevice(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.saveStatus} data-state={saveState}>
              {saveMessage || "Ready"}
            </span>
            <a href={activePageMeta.href} target="_blank" rel="noreferrer">
              Preview
            </a>
            <button
              type="button"
              onClick={savePageContent}
              disabled={saveState === "saving" || saveState === "loading"}
              className={styles.saveButton}
            >
              {saveState === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </header>

        <div
          className={styles.previewScroll}
          onClick={() => {
            setSelectedBlockId(null);
            setSelectedSubTarget(null);
          }}
        >
          <div
            className={styles.previewFrame}
            style={
              deviceWidth ? { maxWidth: `${deviceWidth}px` } : undefined
            }
            onClick={(event) => event.stopPropagation()}
          >
            <FashionEditorialPage
              content={content}
              editorMode
              selectedBlockId={selectedBlockId}
              onSelectBlock={(id) => {
                setSelectedBlockId(id);
                setSelectedSubTarget(null);
                setLeftPanel("blocks");
              }}
              selectedSubTarget={selectedSubTarget}
              onSelectSubTarget={(target) => {
                setSelectedSubTarget(target);
                if (target) {
                  const owningBlockId = target.split("::")[0];
                  setSelectedBlockId(owningBlockId);
                  setLeftPanel("blocks");
                }
              }}
              onUpdateBlockLayout={updateBlockLayoutByid}
              onUpdateItemLayout={updateItemLayoutById}
            />
          </div>
        </div>
      </section>

      <aside
        className={`${styles.inspector} ${
          selectedBlock ? styles.inspectorOpen : ""
        }`}
      >
        {renderInspector()}
      </aside>
    </main>
  );
}
