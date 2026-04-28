"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import AboutPageView from "@/components/AboutPageView";
import {
  getDefaultAboutPageContent,
  type AboutPageContent,
  type AboutServiceLink,
} from "@/data/aboutPageContent";
import {
  editablePages,
  type EditablePageSlug,
} from "@/data/pageContent";
import styles from "./AdminUploader.module.css";

type SaveState = "idle" | "loading" | "saving" | "saved" | "error";
type LeftPanel = "content" | "settings";
type SectionKey = "intro" | "description" | "capabilities" | "cta" | "seo";
type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DeviceMode, number | null> = {
  desktop: null,
  tablet: 900,
  mobile: 414,
};

const SECTION_LABELS: Record<SectionKey, string> = {
  intro: "Intro headline",
  description: "Description",
  capabilities: "Capabilities",
  cta: "CTA",
  seo: "SEO",
};

interface AboutPageEditorProps {
  activePage: EditablePageSlug;
  onActivePageChange: (page: EditablePageSlug) => void;
  onLogout: () => void;
}

function cloneContent(content: AboutPageContent): AboutPageContent {
  return JSON.parse(JSON.stringify(content)) as AboutPageContent;
}

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export default function AboutPageEditor({
  activePage,
  onActivePageChange,
  onLogout,
}: AboutPageEditorProps) {
  const [content, setContent] = useState<AboutPageContent>(() =>
    getDefaultAboutPageContent(),
  );
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("content");
  const [selectedSection, setSelectedSection] = useState<SectionKey>("intro");
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [saveMessage, setSaveMessage] = useState("");
  const [device, setDevice] = useState<DeviceMode>("desktop");

  const activePageMeta =
    editablePages.find((page) => page.slug === activePage) ?? editablePages[0];
  const deviceWidth = DEVICE_WIDTHS[device];
  const selectedLabel = SECTION_LABELS[selectedSection];

  const descriptionCount = useMemo(
    () => content.descriptionParagraphs.length,
    [content.descriptionParagraphs.length],
  );

  useEffect(() => {
    let ignore = false;

    async function loadContent() {
      setSaveState("loading");
      setSaveMessage("Dang tai noi dung About...");
      try {
        const res = await fetch("/api/admin/about", { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "Khong tai duoc noi dung About");
        }
        const data = (await res.json()) as AboutPageContent;
        if (!ignore) {
          setContent(data);
          setSaveState("idle");
          setSaveMessage("Da tai noi dung About.");
        }
      } catch (error) {
        if (!ignore) {
          setSaveState("error");
          setSaveMessage(
            error instanceof Error ? error.message : "Khong tai duoc du lieu",
          );
        }
      }
    }

    loadContent();
    return () => {
      ignore = true;
    };
  }, []);

  function markDirty() {
    setSaveState("idle");
  }

  function updateContent(patch: Partial<AboutPageContent>) {
    setContent((current) => ({ ...current, ...patch }));
    markDirty();
  }

  function updateServiceLink(index: number, patch: Partial<AboutServiceLink>) {
    setContent((current) => {
      const serviceLinks = [...current.serviceLinks];
      serviceLinks[index] = { ...serviceLinks[index], ...patch };
      return { ...current, serviceLinks };
    });
    markDirty();
  }

  function addServiceLink() {
    setContent((current) => ({
      ...current,
      serviceLinks: [
        ...current.serviceLinks,
        { id: uid("service"), label: "new link", href: "/" },
      ],
    }));
    markDirty();
  }

  function removeServiceLink(index: number) {
    setContent((current) => ({
      ...current,
      serviceLinks: current.serviceLinks.filter((_, itemIndex) => itemIndex !== index),
    }));
    markDirty();
  }

  function updateParagraph(index: number, value: string) {
    setContent((current) => {
      const descriptionParagraphs = [...current.descriptionParagraphs];
      descriptionParagraphs[index] = value;
      return { ...current, descriptionParagraphs };
    });
    markDirty();
  }

  function addParagraph() {
    setContent((current) => ({
      ...current,
      descriptionParagraphs: [...current.descriptionParagraphs, "New paragraph"],
    }));
    markDirty();
  }

  function removeParagraph(index: number) {
    setContent((current) => ({
      ...current,
      descriptionParagraphs: current.descriptionParagraphs.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
    markDirty();
  }

  function moveParagraph(from: number, to: number) {
    if (to < 0 || to >= content.descriptionParagraphs.length) return;
    setContent((current) => {
      const descriptionParagraphs = [...current.descriptionParagraphs];
      const [moved] = descriptionParagraphs.splice(from, 1);
      descriptionParagraphs.splice(to, 0, moved);
      return { ...current, descriptionParagraphs };
    });
    markDirty();
  }

  async function saveAboutContent() {
    setSaveState("saving");
    setSaveMessage("Dang luu About...");

    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Khong luu duoc About");
      }
      setSaveState("saved");
      setSaveMessage("Da luu About. Mo /about de xem ket qua.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(
        error instanceof Error ? error.message : "Khong luu duoc du lieu",
      );
    }
  }

  function renderSectionButton(
    key: SectionKey,
    subtitle: string,
    indexLabel: string,
  ) {
    return (
      <button
        key={key}
        type="button"
        className={`${styles.blockListItem} ${
          selectedSection === key ? styles.blockListItemActive : ""
        }`}
        onClick={() => {
          setSelectedSection(key);
          setLeftPanel(key === "seo" ? "settings" : "content");
        }}
      >
        <span className={styles.blockListIndex}>{indexLabel}</span>
        <span className={styles.blockListBody}>
          <strong>{SECTION_LABELS[key]}</strong>
          <em>{subtitle}</em>
        </span>
      </button>
    );
  }

  function renderContentPanel() {
    return (
      <div className={styles.leftPanelInner}>
        <div className={styles.leftPanelHeader}>
          <h3>About content</h3>
          <span>Exact frontend</span>
        </div>
        <div className={styles.blockList}>
          {renderSectionButton(
            "intro",
            "Headline with service links",
            "01",
          )}
          {renderSectionButton(
            "description",
            `${descriptionCount} paragraphs`,
            "02",
          )}
          {renderSectionButton(
            "capabilities",
            content.capabilitiesTitle,
            "03",
          )}
          {renderSectionButton("cta", content.ctaLabel, "04")}
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
        <div className={styles.blockList}>
          {renderSectionButton("seo", "Page title and description", "SEO")}
        </div>
        <button
          type="button"
          className={styles.fullWidthButton}
          onClick={() => {
            const fresh = cloneContent(getDefaultAboutPageContent());
            setContent(fresh);
            setSelectedSection("intro");
            setLeftPanel("content");
            setSaveState("idle");
            setSaveMessage("Da reset About ve noi dung mac dinh. Bam Save de luu.");
          }}
        >
          Reset to frontend defaults
        </button>
      </div>
    );
  }

  function renderInspector() {
    return (
      <>
        <header className={styles.inspectorHeader}>
          <div>
            <span className={styles.inspectorEyebrow}>About page</span>
            <h3>{selectedLabel}</h3>
          </div>
        </header>
        <div className={styles.inspectorBody}>
          {selectedSection === "intro" && (
            <>
              <Field label="Intro prefix">
                <textarea
                  rows={4}
                  value={content.introPrefix}
                  onChange={(event) =>
                    updateContent({ introPrefix: event.target.value })
                  }
                />
              </Field>
              <Field label="Intro suffix">
                <input
                  value={content.introSuffix}
                  onChange={(event) =>
                    updateContent({ introSuffix: event.target.value })
                  }
                />
              </Field>
              <div className={styles.itemsPanel}>
                <div className={styles.itemsHeader}>
                  <h4>Service links</h4>
                  <button type="button" onClick={addServiceLink}>
                    + Add
                  </button>
                </div>
                {content.serviceLinks.map((link, index) => (
                  <details key={link.id} className={styles.itemEditor} open>
                    <summary>
                      <strong>
                        {String(index + 1).padStart(2, "0")} - {link.label}
                      </strong>
                      <span className={styles.itemEditorActions}>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            removeServiceLink(index);
                          }}
                        >
                          x
                        </button>
                      </span>
                    </summary>
                    <Field label="Label">
                      <input
                        value={link.label}
                        onChange={(event) =>
                          updateServiceLink(index, {
                            label: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Href">
                      <input
                        value={link.href}
                        onChange={(event) =>
                          updateServiceLink(index, { href: event.target.value })
                        }
                      />
                    </Field>
                  </details>
                ))}
              </div>
            </>
          )}

          {selectedSection === "description" && (
            <div className={styles.itemsPanel}>
              <div className={styles.itemsHeader}>
                <h4>Paragraphs</h4>
                <button type="button" onClick={addParagraph}>
                  + Add
                </button>
              </div>
              {content.descriptionParagraphs.map((paragraph, index) => (
                <details
                  key={`${index}-${paragraph.slice(0, 18)}`}
                  className={styles.itemEditor}
                  open
                >
                  <summary>
                    <strong>{String(index + 1).padStart(2, "0")}</strong>
                    <span className={styles.itemEditorActions}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          moveParagraph(index, index - 1);
                        }}
                        disabled={index === 0}
                      >
                        up
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          moveParagraph(index, index + 1);
                        }}
                        disabled={index === content.descriptionParagraphs.length - 1}
                      >
                        down
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          removeParagraph(index);
                        }}
                      >
                        x
                      </button>
                    </span>
                  </summary>
                  <Field label="Text">
                    <textarea
                      rows={6}
                      value={paragraph}
                      onChange={(event) =>
                        updateParagraph(index, event.target.value)
                      }
                    />
                  </Field>
                </details>
              ))}
            </div>
          )}

          {selectedSection === "capabilities" && (
            <>
              <Field label="Section title">
                <input
                  value={content.capabilitiesTitle}
                  onChange={(event) =>
                    updateContent({ capabilitiesTitle: event.target.value })
                  }
                />
              </Field>
              <Field label="Capability text">
                <textarea
                  rows={7}
                  value={content.capabilitiesBody}
                  onChange={(event) =>
                    updateContent({ capabilitiesBody: event.target.value })
                  }
                />
              </Field>
            </>
          )}

          {selectedSection === "cta" && (
            <div className={styles.twoColumns}>
              <Field label="Button label">
                <input
                  value={content.ctaLabel}
                  onChange={(event) =>
                    updateContent({ ctaLabel: event.target.value })
                  }
                />
              </Field>
              <Field label="Button href">
                <input
                  value={content.ctaHref}
                  onChange={(event) =>
                    updateContent({ ctaHref: event.target.value })
                  }
                />
              </Field>
            </div>
          )}

          {selectedSection === "seo" && (
            <>
              <Field label="Page title">
                <input
                  value={content.title}
                  onChange={(event) =>
                    updateContent({ title: event.target.value })
                  }
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
            </>
          )}
        </div>
      </>
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
            Content
          </button>
          <button
            type="button"
            className={leftPanel === "settings" ? styles.tabActive : ""}
            onClick={() => setLeftPanel("settings")}
          >
            Settings
          </button>
        </nav>
        <div className={styles.leftPanel}>
          {leftPanel === "settings"
            ? renderSettingsPanel()
            : renderContentPanel()}
        </div>
        <div className={styles.railFooter}>
          <a href={activePageMeta.href} target="_blank" rel="noreferrer">
            View site
          </a>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <section className={styles.canvas}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <p>{activePageMeta.label} page</p>
            <h1>About editor</h1>
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
              onClick={saveAboutContent}
              disabled={saveState === "saving" || saveState === "loading"}
              className={styles.saveButton}
            >
              {saveState === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </header>

        <div className={styles.previewScroll}>
          <div
            className={styles.previewFrame}
            style={
              deviceWidth ? { maxWidth: `${deviceWidth}px` } : undefined
            }
          >
            <AboutPageView content={content} />
          </div>
        </div>
      </section>

      <aside className={`${styles.inspector} ${styles.inspectorOpen}`}>
        {renderInspector()}
      </aside>
    </main>
  );
}
