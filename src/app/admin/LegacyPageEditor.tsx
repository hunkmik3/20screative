"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import PhotoGrid, { type PhotoProject } from "@/components/PhotoGrid";
import ProjectGrid, {
  type FeaturedSeries,
  type VideoProject,
} from "@/components/ProjectGrid";
import SportGrid, { type SportProgram } from "@/components/SportGrid";
import type { FashionLayout } from "@/data/fashionPage";
import {
  getDefaultLegacyPageContent,
  type LegacyCommercialPageContent,
  type LegacyPageContent,
  type LegacyPageSlug,
  type LegacyPhotoPageContent,
  type LegacySportPageContent,
} from "@/data/legacyPageContent";
import {
  editablePages,
  type EditablePageSlug,
} from "@/data/pageContent";
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
type LeftPanel = "content" | "page" | "media" | "settings";
type SelectionKey =
  | "page"
  | "newest"
  | "opening"
  | "featured"
  | `latest:${number}`
  | `openingVideo:${number}`
  | `featuredVideo:${number}`
  | `program:${number}`
  | `project:${number}`;

interface Props {
  activePage: LegacyPageSlug;
  onActivePageChange: (page: EditablePageSlug) => void;
  onLogout: () => void;
}

const PARALLEL_PARTS = 4;

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneContent<T>(content: T): T {
  return JSON.parse(JSON.stringify(content)) as T;
}

function createVideoProject(): VideoProject {
  return {
    id: uid("video"),
    thumbnail: "",
    title: "New video",
    description: "",
    duration: "00:00",
    videoUrl: "",
    streamUid: "",
  };
}

function createSportProgram(): SportProgram {
  return {
    id: uid("program"),
    thumbnail: "",
    title: "#NewProgram",
    subtitle: "",
    videoUrl: "",
    streamUid: "",
  };
}

function createSportLookbook(): FeaturedSeries {
  return {
    title: "Sport Stories in Motion",
    videoCount: 0,
    description: "Vertical sport films and campaign chapters",
    videos: [],
  };
}

function createPhotoProject(): PhotoProject {
  return {
    id: uid("photo"),
    thumbnail: "",
    title: "New gallery image",
    description: "",
    duration: "Editorial",
  };
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
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

export default function LegacyPageEditor({
  activePage,
  onActivePageChange,
  onLogout,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [content, setContent] = useState<LegacyPageContent>(() =>
    getDefaultLegacyPageContent(activePage),
  );
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("content");
  const [selectedKey, setSelectedKey] = useState<SelectionKey>("page");
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [saveMessage, setSaveMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const activePageMeta =
    editablePages.find((page) => page.slug === activePage) ?? editablePages[0];
  const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  useEffect(() => {
    let ignore = false;
    setSaveState("loading");
    setSelectedKey("page");
    setContent(getDefaultLegacyPageContent(activePage));

    async function loadContent() {
      try {
        const res = await fetch(`/api/admin/legacy-pages/${activePage}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "Không tải được dữ liệu trang cũ");
        }
        const data = (await res.json()) as LegacyPageContent;
        if (!ignore) {
          setContent(data);
          setSaveState("idle");
          setSaveMessage(`Đã tải layout cũ của ${activePageMeta.label}.`);
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

    loadContent();
    return () => {
      ignore = true;
    };
  }, [activePage, activePageMeta.label]);

  function markDirty() {
    setSaveState("idle");
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

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setUploadError(null);
    setUploadedUrl(null);
    setProgress(0);
    setUploadStatus("");
  }

  function resetUpload() {
    setFile(null);
    setProgress(0);
    setUploadStatus("");
    setUploadError(null);
    setUploadedUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function saveContent() {
    setSaveState("saving");
    setSaveMessage(`Đang lưu layout cũ của ${activePageMeta.label}...`);

    try {
      const res = await fetch(`/api/admin/legacy-pages/${activePage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Không lưu được dữ liệu trang");
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

  function resetDefaults() {
    const fresh = getDefaultLegacyPageContent(activePage);
    setContent(fresh);
    setSelectedKey("page");
    setSaveState("idle");
    setSaveMessage(
      `Đã reset ${activePageMeta.label} về giao diện cũ mặc định. Bấm Save để lưu.`,
    );
  }

  function updateCommercial(patch: Partial<LegacyCommercialPageContent>) {
    setContent((current) =>
      current.kind === "commercial" ? { ...current, ...patch } : current,
    );
    markDirty();
  }

  function updateSport(patch: Partial<LegacySportPageContent>) {
    setContent((current) =>
      current.kind === "sport" ? { ...current, ...patch } : current,
    );
    markDirty();
  }

  function updatePhoto(patch: Partial<LegacyPhotoPageContent>) {
    setContent((current) =>
      current.kind === "photo" ? { ...current, ...patch } : current,
    );
    markDirty();
  }

  function updateLatestVideo(index: number, patch: Partial<VideoProject>) {
    setContent((current) => {
      if (current.kind !== "commercial") return current;
      const latestVideos = [...current.latestVideos];
      latestVideos[index] = { ...latestVideos[index], ...patch };
      return { ...current, latestVideos };
    });
    markDirty();
  }

  function updateFeaturedVideo(index: number, patch: Partial<VideoProject>) {
    setContent((current) => {
      if (current.kind !== "commercial" && current.kind !== "sport") {
        return current;
      }
      const baseSeries =
        current.kind === "sport" && !current.featuredSeries
          ? createSportLookbook()
          : current.featuredSeries;
      const videos = [...baseSeries.videos];
      videos[index] = { ...videos[index], ...patch };
      return {
        ...current,
        featuredSeries: {
          ...baseSeries,
          videos,
          videoCount: videos.length,
        },
      };
    });
    markDirty();
  }

  function updateOpeningVideo(index: number, patch: Partial<VideoProject>) {
    setContent((current) => {
      if (current.kind !== "sport") return current;
      const videos = [...current.openingSeries.videos];
      videos[index] = { ...videos[index], ...patch };
      return {
        ...current,
        openingSeries: {
          ...current.openingSeries,
          videos,
          videoCount: videos.length,
        },
      };
    });
    markDirty();
  }

  function updateProgram(index: number, patch: Partial<SportProgram>) {
    setContent((current) => {
      if (current.kind !== "sport") return current;
      const programs = [...current.programs];
      programs[index] = { ...programs[index], ...patch };
      return { ...current, programs };
    });
    markDirty();
  }

  function updateProject(index: number, patch: Partial<PhotoProject>) {
    setContent((current) => {
      if (current.kind !== "photo") return current;
      const projects = [...current.projects];
      projects[index] = { ...projects[index], ...patch };
      return { ...current, projects };
    });
    markDirty();
  }

  function addLatestVideo() {
    setContent((current) => {
      if (current.kind !== "commercial") return current;
      const latestVideos = [...current.latestVideos, createVideoProject()];
      setSelectedKey(`latest:${latestVideos.length - 1}`);
      return { ...current, latestVideos };
    });
    markDirty();
  }

  function addFeaturedVideo() {
    setContent((current) => {
      if (current.kind !== "commercial" && current.kind !== "sport") {
        return current;
      }
      const baseSeries =
        current.kind === "sport" && !current.featuredSeries
          ? createSportLookbook()
          : current.featuredSeries;
      const videos = [...baseSeries.videos, createVideoProject()];
      setSelectedKey(`featuredVideo:${videos.length - 1}`);
      return {
        ...current,
        featuredSeries: { ...baseSeries, videos, videoCount: videos.length },
      };
    });
    markDirty();
  }

  function addOpeningVideo() {
    setContent((current) => {
      if (current.kind !== "sport") return current;
      const videos = [...current.openingSeries.videos, createVideoProject()];
      setSelectedKey(`openingVideo:${videos.length - 1}`);
      return {
        ...current,
        openingSeries: {
          ...current.openingSeries,
          videos,
          videoCount: videos.length,
        },
      };
    });
    markDirty();
  }

  function addProgram() {
    setContent((current) => {
      if (current.kind !== "sport") return current;
      if (current.programs.length > 0) {
        setSelectedKey("program:0");
        return current;
      }
      const programs = [...current.programs, createSportProgram()];
      setSelectedKey(`program:${programs.length - 1}`);
      return { ...current, programs };
    });
    markDirty();
  }

  function addProject() {
    setContent((current) => {
      if (current.kind !== "photo") return current;
      const projects = [...current.projects, createPhotoProject()];
      setSelectedKey(`project:${projects.length - 1}`);
      return { ...current, projects };
    });
    markDirty();
  }

  function removeSelectedItem() {
    const [type, rawIndex] = selectedKey.split(":");
    const index = Number(rawIndex);
    if (!Number.isFinite(index)) return;

    setContent((current) => {
      if (current.kind === "commercial" && type === "latest") {
        const latestVideos = current.latestVideos.filter((_, i) => i !== index);
        setSelectedKey("page");
        return { ...current, latestVideos };
      }
      if (current.kind === "commercial" && type === "featuredVideo") {
        const videos = current.featuredSeries.videos.filter((_, i) => i !== index);
        setSelectedKey("featured");
        return {
          ...current,
          featuredSeries: { ...current.featuredSeries, videos, videoCount: videos.length },
        };
      }
      if (current.kind === "sport" && type === "openingVideo") {
        const videos = current.openingSeries.videos.filter((_, i) => i !== index);
        setSelectedKey("opening");
        return {
          ...current,
          openingSeries: {
            ...current.openingSeries,
            videos,
            videoCount: videos.length,
          },
        };
      }
      if (current.kind === "sport" && type === "featuredVideo") {
        const videos = current.featuredSeries.videos.filter((_, i) => i !== index);
        setSelectedKey("featured");
        return {
          ...current,
          featuredSeries: {
            ...current.featuredSeries,
            videos,
            videoCount: videos.length,
          },
        };
      }
      if (current.kind === "sport" && type === "program") {
        const programs = current.programs.filter((_, i) => i !== index);
        setSelectedKey("page");
        return { ...current, programs };
      }
      if (current.kind === "photo" && type === "project") {
        const projects = current.projects.filter((_, i) => i !== index);
        setSelectedKey("page");
        return { ...current, projects };
      }
      return current;
    });
    markDirty();
  }

  function duplicateSelectedItem() {
    const [type, rawIndex] = selectedKey.split(":");
    const index = Number(rawIndex);
    if (!Number.isFinite(index)) return;

    setContent((current) => {
      if (current.kind === "commercial" && type === "latest") {
        const source = current.latestVideos[index];
        if (!source) return current;
        const latestVideos = [...current.latestVideos];
        latestVideos.splice(index + 1, 0, {
          ...cloneContent(source),
          id: uid("video"),
        });
        setSelectedKey(`latest:${index + 1}`);
        return { ...current, latestVideos };
      }
      if (current.kind === "commercial" && type === "featuredVideo") {
        const source = current.featuredSeries.videos[index];
        if (!source) return current;
        const videos = [...current.featuredSeries.videos];
        videos.splice(index + 1, 0, { ...cloneContent(source), id: uid("video") });
        setSelectedKey(`featuredVideo:${index + 1}`);
        return {
          ...current,
          featuredSeries: { ...current.featuredSeries, videos, videoCount: videos.length },
        };
      }
      if (current.kind === "sport" && type === "openingVideo") {
        const source = current.openingSeries.videos[index];
        if (!source) return current;
        const videos = [...current.openingSeries.videos];
        videos.splice(index + 1, 0, { ...cloneContent(source), id: uid("video") });
        setSelectedKey(`openingVideo:${index + 1}`);
        return {
          ...current,
          openingSeries: {
            ...current.openingSeries,
            videos,
            videoCount: videos.length,
          },
        };
      }
      if (current.kind === "sport" && type === "featuredVideo") {
        const source = current.featuredSeries.videos[index];
        if (!source) return current;
        const videos = [...current.featuredSeries.videos];
        videos.splice(index + 1, 0, { ...cloneContent(source), id: uid("video") });
        setSelectedKey(`featuredVideo:${index + 1}`);
        return {
          ...current,
          featuredSeries: {
            ...current.featuredSeries,
            videos,
            videoCount: videos.length,
          },
        };
      }
      if (current.kind === "sport" && type === "program") {
        setSelectedKey("program:0");
        return current;
      }
      if (current.kind === "photo" && type === "project") {
        const source = current.projects[index];
        if (!source) return current;
        const projects = [...current.projects];
        projects.splice(index + 1, 0, {
          ...cloneContent(source),
          id: uid("photo"),
        });
        setSelectedKey(`project:${index + 1}`);
        return { ...current, projects };
      }
      return current;
    });
    markDirty();
  }

  function moveSelectedItem(direction: -1 | 1) {
    const [type, rawIndex] = selectedKey.split(":");
    const index = Number(rawIndex);
    const target = index + direction;
    if (!Number.isFinite(index)) return;

    setContent((current) => {
      if (current.kind === "commercial" && type === "latest") {
        const latestVideos = moveItem(current.latestVideos, index, target);
        setSelectedKey(`latest:${Math.max(0, Math.min(target, latestVideos.length - 1))}`);
        return { ...current, latestVideos };
      }
      if (current.kind === "commercial" && type === "featuredVideo") {
        const videos = moveItem(current.featuredSeries.videos, index, target);
        setSelectedKey(
          `featuredVideo:${Math.max(0, Math.min(target, videos.length - 1))}`,
        );
        return { ...current, featuredSeries: { ...current.featuredSeries, videos } };
      }
      if (current.kind === "sport" && type === "openingVideo") {
        const videos = moveItem(current.openingSeries.videos, index, target);
        setSelectedKey(
          `openingVideo:${Math.max(0, Math.min(target, videos.length - 1))}`,
        );
        return { ...current, openingSeries: { ...current.openingSeries, videos } };
      }
      if (current.kind === "sport" && type === "featuredVideo") {
        const videos = moveItem(current.featuredSeries.videos, index, target);
        setSelectedKey(
          `featuredVideo:${Math.max(0, Math.min(target, videos.length - 1))}`,
        );
        return { ...current, featuredSeries: { ...current.featuredSeries, videos } };
      }
      if (current.kind === "sport" && type === "program") {
        setSelectedKey("program:0");
        return current;
      }
      if (current.kind === "photo" && type === "project") {
        const projects = moveItem(current.projects, index, target);
        setSelectedKey(`project:${Math.max(0, Math.min(target, projects.length - 1))}`);
        return { ...current, projects };
      }
      return current;
    });
    markDirty();
  }

  function updateLayoutByTarget(target: string, next: FashionLayout) {
    const [type, rawIndex] = target.split(":");
    const index = Number(rawIndex);

    if (target === "newest") {
      setContent((current) =>
        current.kind === "commercial"
          ? {
              ...current,
              newestSeries: { ...current.newestSeries, layout: next },
            }
          : current,
      );
      markDirty();
      return;
    }

    if (!Number.isFinite(index)) return;

    if (type === "latest") {
      updateLatestVideo(index, { layout: next });
    } else if (type === "openingVideo") {
      updateOpeningVideo(index, { layout: next });
    } else if (type === "featuredVideo") {
      updateFeaturedVideo(index, { layout: next });
    } else if (type === "program") {
      updateProgram(index, { layout: next });
    } else if (type === "project") {
      updateProject(index, { layout: next });
    }
  }

  function resetSelectedLayout() {
    const [type, rawIndex] = selectedKey.split(":");
    const index = Number(rawIndex);

    if (selectedKey === "newest") {
      setContent((current) =>
        current.kind === "commercial"
          ? {
              ...current,
              newestSeries: {
                ...current.newestSeries,
                layout: undefined,
              },
            }
          : current,
      );
      markDirty();
      return;
    }

    if (!Number.isFinite(index)) return;

    setContent((current) => {
      if (current.kind === "commercial" && type === "latest") {
        const latestVideos = [...current.latestVideos];
        latestVideos[index] = { ...latestVideos[index], layout: undefined };
        return { ...current, latestVideos };
      }
      if (current.kind === "commercial" && type === "featuredVideo") {
        const videos = [...current.featuredSeries.videos];
        videos[index] = { ...videos[index], layout: undefined };
        return {
          ...current,
          featuredSeries: { ...current.featuredSeries, videos },
        };
      }
      if (current.kind === "sport" && type === "openingVideo") {
        const videos = [...current.openingSeries.videos];
        videos[index] = { ...videos[index], layout: undefined };
        return {
          ...current,
          openingSeries: { ...current.openingSeries, videos },
        };
      }
      if (current.kind === "sport" && type === "featuredVideo") {
        const videos = [...current.featuredSeries.videos];
        videos[index] = { ...videos[index], layout: undefined };
        return {
          ...current,
          featuredSeries: { ...current.featuredSeries, videos },
        };
      }
      if (current.kind === "sport" && type === "program") {
        const programs = [...current.programs];
        programs[index] = { ...programs[index], layout: undefined };
        return { ...current, programs };
      }
      if (current.kind === "photo" && type === "project") {
        const projects = [...current.projects];
        projects[index] = { ...projects[index], layout: undefined };
        return { ...current, projects };
      }
      return current;
    });
    markDirty();
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
          >
            Use upload
          </button>
        </div>
      </Field>
    );
  }

  function renderVideoFields(
    video: VideoProject,
    onChange: (patch: Partial<VideoProject>) => void,
  ) {
    return (
      <>
        <Field label="ID" hint="Dùng cho key nội bộ, không nên trùng.">
          <input
            value={video.id}
            onChange={(event) => onChange({ id: event.target.value })}
          />
        </Field>
        <Field label="Title">
          <input
            value={video.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={video.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </Field>
        {renderMediaField("Thumbnail", video.thumbnail, (thumbnail) =>
          onChange({ thumbnail }),
        )}
        <div className={styles.twoColumns}>
          <Field label="Duration">
            <input
              value={video.duration}
              onChange={(event) => onChange({ duration: event.target.value })}
            />
          </Field>
          <Field label="Video URL">
            <input
              value={video.videoUrl}
              onChange={(event) => onChange({ videoUrl: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Cloudflare Stream UID" hint="Ưu tiên dùng UID này để phát video. Video URL R2 vẫn giữ làm fallback.">
          <input
            value={video.streamUid ?? ""}
            onChange={(event) => onChange({ streamUid: event.target.value })}
            placeholder="Ví dụ: 6b9e68b07dfee8cc2d116e4c51d6a957"
          />
        </Field>
      </>
    );
  }

  function renderStructureButton(
    key: SelectionKey,
    title: string,
    subtitle: string,
    indexLabel?: string,
  ) {
    return (
      <button
        key={key}
        type="button"
        className={`${styles.blockListItem} ${
          selectedKey === key ? styles.blockListItemActive : ""
        }`}
        onClick={() => setSelectedKey(key)}
      >
        <span className={styles.blockListIndex}>{indexLabel ?? "--"}</span>
        <span className={styles.blockListBody}>
          <strong>{title || "Untitled"}</strong>
          <em>{subtitle}</em>
        </span>
      </button>
    );
  }

  function renderContentPanel() {
    return (
      <div className={styles.leftPanelInner}>
        <div className={styles.leftPanelHeader}>
          <h3>
            {content.kind === "sport"
              ? "Blocks"
              : content.kind === "photo"
                ? "Gallery"
                : "Old layout"}
          </h3>
          <span>
            {content.kind === "sport"
              ? "Sport builder"
              : content.kind === "photo"
                ? "20 image layout"
                : activePageMeta.label}
          </span>
        </div>
        <div className={styles.blockList}>
          {content.kind !== "sport" &&
            renderStructureButton("page", "Page header", "Title and subtitle")}
          {content.kind === "commercial" && (
            <>
              {content.latestVideos.map((video, index) =>
                renderStructureButton(
                  `latest:${index}`,
                  video.title,
                  "Latest video",
                  String(index + 1).padStart(2, "0"),
                ),
              )}
              <button
                type="button"
                className={styles.fullWidthButton}
                onClick={addLatestVideo}
              >
                + Add latest video
              </button>
              {renderStructureButton("newest", "Newest Video", content.newestSeries.title)}
              {renderStructureButton(
                "featured",
                "Video Lookbook",
                content.featuredSeries.title,
              )}
              {content.featuredSeries.videos.map((video, index) =>
                renderStructureButton(
                  `featuredVideo:${index}`,
                  video.title,
                  "Lookbook video",
                  String(index + 1).padStart(2, "0"),
                ),
              )}
              <button
                type="button"
                className={styles.fullWidthButton}
                onClick={addFeaturedVideo}
              >
                + Add lookbook video
              </button>
            </>
          )}
          {content.kind === "sport" && (
            <>
              {renderStructureButton(
                "opening",
                "Opening Video Lookbook",
                content.openingSeries.title,
                "01",
              )}
              {content.openingSeries.videos.map((video, index) =>
                renderStructureButton(
                  `openingVideo:${index}`,
                  video.title,
                  "Opening lookbook video",
                  `01.${String(index + 1).padStart(2, "0")}`,
                ),
              )}
              <button
                type="button"
                className={styles.fullWidthButton}
                onClick={addOpeningVideo}
              >
                + Add opening video
              </button>
              {content.programs[0] &&
                renderStructureButton(
                  "program:0",
                  content.programs[0].title,
                  "Horizontal video block",
                  "02",
                )}
              {!content.programs[0] && (
                <button
                  type="button"
                  className={styles.fullWidthButton}
                  onClick={addProgram}
                >
                  + Add horizontal video
                </button>
              )}
              {renderStructureButton(
                "featured",
                "Closing Video Lookbook",
                content.featuredSeries.title,
                "03",
              )}
              {content.featuredSeries.videos.map((video, index) =>
                renderStructureButton(
                  `featuredVideo:${index}`,
                  video.title,
                  "Closing lookbook video",
                  `03.${String(index + 1).padStart(2, "0")}`,
                ),
              )}
              <button
                type="button"
                className={styles.fullWidthButton}
                onClick={addFeaturedVideo}
              >
                + Add lookbook video
              </button>
            </>
          )}
          {content.kind === "photo" && (
            <>
              {content.projects.map((project, index) =>
                renderStructureButton(
                  `project:${index}`,
                  project.title,
                  project.duration || project.description,
                  String(index + 1).padStart(2, "0"),
                ),
              )}
              <button
                type="button"
                className={styles.fullWidthButton}
                onClick={addProject}
              >
                + Add image
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderPagePanel() {
    return (
      <div className={styles.leftPanelInner}>
        <div className={styles.leftPanelHeader}>
          <h3>Page</h3>
        </div>
        <p className={styles.muted}>
          {content.kind === "sport"
            ? "Chỉnh thông tin cấp trang của Sport builder ở panel bên phải."
            : content.kind === "photo"
              ? "Chỉnh tiêu đề và mô tả của gallery 20 ảnh ở panel bên phải."
            : "Chỉnh tiêu đề và mô tả của giao diện cũ ở panel bên phải."}
        </p>
        <button
          type="button"
          className={styles.fullWidthButton}
          onClick={() => setSelectedKey("page")}
        >
          Edit page header
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
          Upload thumbnail/video poster lên R2, sau đó bấm Use upload ở field ảnh.
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
          <h3>Settings</h3>
        </div>
        <p className={styles.muted}>
          {content.kind === "photo"
            ? "Reset sẽ đưa gallery về 20 ảnh mẫu với bố cục bất đối xứng."
            : "Reset sẽ đưa trang này về đúng data mẫu của giao diện cũ."}
        </p>
        <button
          type="button"
          className={styles.fullWidthButton}
          onClick={resetDefaults}
        >
          Reset old layout defaults
        </button>
      </div>
    );
  }

  function renderLeftPanel() {
    if (leftPanel === "page") return renderPagePanel();
    if (leftPanel === "media") return renderMediaPanel();
    if (leftPanel === "settings") return renderSettingsPanel();
    return renderContentPanel();
  }

  function renderInspector() {
    const selectedParts = selectedKey.split(":");
    const selectedType = selectedParts[0];
    const selectedIndex = Number(selectedParts[1]);

    return (
      <>
        <header className={styles.inspectorHeader}>
          <div>
            <span className={styles.inspectorEyebrow}>Old UI editor</span>
            <h3>{activePageMeta.label}</h3>
          </div>
        </header>
        <div className={styles.inspectorBody}>
          {selectedKey === "page" && content.kind === "commercial" && (
            <>
              <Field label="Category title">
                <input
                  value={content.categoryTitle}
                  onChange={(event) =>
                    updateCommercial({ categoryTitle: event.target.value })
                  }
                />
              </Field>
              <Field label="Category description">
                <textarea
                  value={content.categoryDescription}
                  onChange={(event) =>
                    updateCommercial({
                      categoryDescription: event.target.value,
                    })
                  }
                />
              </Field>
            </>
          )}
          {selectedKey === "page" && content.kind === "sport" && (
            <Field label="Page title">
              <input
                value={content.pageTitle}
                onChange={(event) =>
                  updateSport({ pageTitle: event.target.value })
                }
              />
            </Field>
          )}
          {selectedKey === "page" && content.kind === "photo" && (
            <>
              <Field label="Page title">
                <input
                  value={content.pageTitle}
                  onChange={(event) =>
                    updatePhoto({ pageTitle: event.target.value })
                  }
                />
              </Field>
              <Field label="Page subtitle">
                <input
                  value={content.pageSubtitle}
                  onChange={(event) =>
                    updatePhoto({ pageSubtitle: event.target.value })
                  }
                />
              </Field>
            </>
          )}
          {content.kind === "commercial" &&
            selectedType === "latest" &&
            content.latestVideos[selectedIndex] &&
            renderVideoFields(content.latestVideos[selectedIndex], (patch) =>
              updateLatestVideo(selectedIndex, patch),
            )}
          {content.kind === "commercial" && selectedKey === "newest" && (
            <>
              <Field label="Title">
                <input
                  value={content.newestSeries.title}
                  onChange={(event) =>
                    updateCommercial({
                      newestSeries: {
                        ...content.newestSeries,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={content.newestSeries.description}
                  onChange={(event) =>
                    updateCommercial({
                      newestSeries: {
                        ...content.newestSeries,
                        description: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              {renderMediaField(
                "Thumbnail",
                content.newestSeries.thumbnail,
                (thumbnail) =>
                  updateCommercial({
                    newestSeries: { ...content.newestSeries, thumbnail },
                  }),
              )}
              <Field label="Video URL">
                <input
                  value={content.newestSeries.videoUrl}
                  onChange={(event) =>
                    updateCommercial({
                      newestSeries: {
                        ...content.newestSeries,
                        videoUrl: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field
                label="Cloudflare Stream UID"
                hint="Ưu tiên UID này cho autoplay/popup. Video URL vẫn giữ làm fallback."
              >
                <input
                  value={content.newestSeries.streamUid ?? ""}
                  onChange={(event) =>
                    updateCommercial({
                      newestSeries: {
                        ...content.newestSeries,
                        streamUid: event.target.value,
                      },
                    })
                  }
                  placeholder="Ví dụ: 6b9e68b07dfee8cc2d116e4c51d6a957"
                />
              </Field>
            </>
          )}
          {content.kind === "commercial" && selectedKey === "featured" && (
            <>
              <Field label="Video lookbook title">
                <input
                  value={content.featuredSeries.title}
                  onChange={(event) =>
                    updateCommercial({
                      featuredSeries: {
                        ...content.featuredSeries,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Video lookbook description">
                <textarea
                  value={content.featuredSeries.description}
                  onChange={(event) =>
                    updateCommercial({
                      featuredSeries: {
                        ...content.featuredSeries,
                        description: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </>
          )}
          {content.kind === "commercial" &&
            selectedType === "featuredVideo" &&
            content.featuredSeries.videos[selectedIndex] &&
            renderVideoFields(
              content.featuredSeries.videos[selectedIndex],
              (patch) => updateFeaturedVideo(selectedIndex, patch),
            )}
          {content.kind === "sport" && selectedKey === "opening" && (
            <>
              <Field label="Opening lookbook title">
                <input
                  value={content.openingSeries.title}
                  onChange={(event) =>
                    updateSport({
                      openingSeries: {
                        ...content.openingSeries,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Opening lookbook description">
                <textarea
                  value={content.openingSeries.description}
                  onChange={(event) =>
                    updateSport({
                      openingSeries: {
                        ...content.openingSeries,
                        description: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </>
          )}
          {content.kind === "sport" &&
            selectedType === "openingVideo" &&
            content.openingSeries.videos[selectedIndex] &&
            renderVideoFields(
              content.openingSeries.videos[selectedIndex],
              (patch) => updateOpeningVideo(selectedIndex, patch),
            )}
          {content.kind === "sport" && selectedKey === "featured" && (
            <>
              <Field label="Closing lookbook title">
                <input
                  value={content.featuredSeries.title}
                  onChange={(event) =>
                    updateSport({
                      featuredSeries: {
                        ...content.featuredSeries,
                        title: event.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Closing lookbook description">
                <textarea
                  value={content.featuredSeries.description}
                  onChange={(event) =>
                    updateSport({
                      featuredSeries: {
                        ...content.featuredSeries,
                        description: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </>
          )}
          {content.kind === "sport" &&
            selectedType === "featuredVideo" &&
            content.featuredSeries.videos[selectedIndex] &&
            renderVideoFields(
              content.featuredSeries.videos[selectedIndex],
              (patch) => updateFeaturedVideo(selectedIndex, patch),
            )}
          {content.kind === "sport" &&
            selectedType === "program" &&
            content.programs[selectedIndex] && (
              <>
                <Field label="ID">
                  <input
                    value={content.programs[selectedIndex].id}
                    onChange={(event) =>
                      updateProgram(selectedIndex, { id: event.target.value })
                    }
                  />
                </Field>
                <Field label="Title">
                  <input
                    value={content.programs[selectedIndex].title}
                    onChange={(event) =>
                      updateProgram(selectedIndex, {
                        title: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Subtitle">
                  <textarea
                    value={content.programs[selectedIndex].subtitle}
                    onChange={(event) =>
                      updateProgram(selectedIndex, {
                        subtitle: event.target.value,
                      })
                    }
                  />
                </Field>
                {renderMediaField(
                  "Thumbnail",
                  content.programs[selectedIndex].thumbnail,
                  (thumbnail) => updateProgram(selectedIndex, { thumbnail }),
                )}
                <Field label="Video URL">
                  <input
                    value={content.programs[selectedIndex].videoUrl}
                    onChange={(event) =>
                      updateProgram(selectedIndex, {
                        videoUrl: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Cloudflare Stream UID" hint="Ưu tiên dùng UID này để phát video. Video URL R2 vẫn giữ làm fallback.">
                  <input
                    value={content.programs[selectedIndex].streamUid ?? ""}
                    onChange={(event) =>
                      updateProgram(selectedIndex, {
                        streamUid: event.target.value,
                      })
                    }
                    placeholder="Ví dụ: 6b9e68b07dfee8cc2d116e4c51d6a957"
                  />
                </Field>
              </>
            )}
          {content.kind === "photo" &&
            selectedType === "project" &&
            content.projects[selectedIndex] && (
              <>
                <Field label="ID">
                  <input
                    value={content.projects[selectedIndex].id}
                    onChange={(event) =>
                      updateProject(selectedIndex, { id: event.target.value })
                    }
                  />
                </Field>
                <Field label="Caption title">
                  <input
                    value={content.projects[selectedIndex].title}
                    onChange={(event) =>
                      updateProject(selectedIndex, {
                        title: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Caption description">
                  <textarea
                    value={content.projects[selectedIndex].description}
                    onChange={(event) =>
                      updateProject(selectedIndex, {
                        description: event.target.value,
                      })
                    }
                  />
                </Field>
                {renderMediaField(
                  "Image",
                  content.projects[selectedIndex].thumbnail,
                  (thumbnail) => updateProject(selectedIndex, { thumbnail }),
                )}
                <Field label="Meta label">
                  <input
                    value={content.projects[selectedIndex].duration}
                    onChange={(event) =>
                      updateProject(selectedIndex, {
                        duration: event.target.value,
                      })
                    }
                  />
                </Field>
              </>
            )}
        </div>
        <footer className={styles.inspectorFooter}>
          <button type="button" onClick={() => moveSelectedItem(-1)}>
            Up
          </button>
          <button type="button" onClick={() => moveSelectedItem(1)}>
            Down
          </button>
          <button type="button" onClick={duplicateSelectedItem}>
            Duplicate
          </button>
          <button type="button" onClick={resetSelectedLayout}>
            Reset size
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={removeSelectedItem}
          >
            Delete
          </button>
        </footer>
      </>
    );
  }

  function renderPreview() {
    if (content.kind === "commercial") {
      return (
        <ProjectGrid
          categoryTitle={content.categoryTitle}
          categoryDescription={content.categoryDescription}
          latestVideos={content.latestVideos}
          newestSeries={content.newestSeries}
          featuredSeries={content.featuredSeries}
          editorMode
          selectedTarget={selectedKey}
          onSelectTarget={(target) => setSelectedKey(target as SelectionKey)}
          onUpdateLayout={updateLayoutByTarget}
        />
      );
    }

    if (content.kind === "sport") {
      return (
        <SportGrid
          programs={content.programs}
          openingSeries={content.openingSeries}
          featuredSeries={content.featuredSeries}
          pageTitle={content.pageTitle}
          editorMode
          selectedTarget={selectedKey}
          onSelectTarget={(target) => setSelectedKey(target as SelectionKey)}
          onUpdateLayout={updateLayoutByTarget}
        />
      );
    }

    return (
      <PhotoGrid
        projects={content.projects}
        pageTitle={content.pageTitle}
        pageSubtitle={content.pageSubtitle}
        editorMode
        selectedTarget={selectedKey}
        onSelectTarget={(target) => setSelectedKey(target as SelectionKey)}
        onUpdateLayout={updateLayoutByTarget}
      />
    );
  }

  return (
    <main className={`${styles.shell} ${styles.legacyShell}`}>
      <aside className={styles.leftRail}>
        <Link href="/" className={styles.logo}>
          20s<em>creative</em>
        </Link>
        <div className={styles.pageSwitcher}>
          <span>Editing page</span>
          <select
            value={activePage}
            onChange={(event) =>
              onActivePageChange(event.target.value as EditablePageSlug)
            }
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
            className={leftPanel === "content" ? styles.tabActive : ""}
            onClick={() => setLeftPanel("content")}
          >
            {content.kind === "sport"
              ? "Blocks"
              : content.kind === "photo"
                ? "Images"
                : "Items"}
          </button>
          <button
            type="button"
            className={leftPanel === "page" ? styles.tabActive : ""}
            onClick={() => setLeftPanel("page")}
          >
            Page
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
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <section className={styles.canvas}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <p>
              {content.kind === "sport"
                ? `${activePageMeta.label} builder`
                : content.kind === "photo"
                  ? `${activePageMeta.label} gallery`
                : `${activePageMeta.label} old UI`}
            </p>
            <h1>
              {content.kind === "sport"
                ? "Visual builder"
                : content.kind === "photo"
                  ? "Gallery builder"
                  : "Legacy editor"}
            </h1>
          </div>
          <div className={styles.deviceSwitcher}>
            <button type="button" className={styles.deviceActive}>
              preview
            </button>
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
              onClick={saveContent}
              disabled={saveState === "saving" || saveState === "loading"}
              className={styles.saveButton}
            >
              {saveState === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </header>

        <div className={styles.previewScroll}>
          <div className={styles.previewFrame}>{renderPreview()}</div>
        </div>
      </section>

      <aside className={`${styles.inspector} ${styles.inspectorOpen}`}>
        {renderInspector()}
      </aside>
    </main>
  );
}
