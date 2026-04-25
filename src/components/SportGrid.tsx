"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import styles from "./SportGrid.module.css";
import VideoPopup from "./VideoPopup";

export interface SportProgram {
    id: string;
    thumbnail: string;
    title: string;
    subtitle: string;
    videoUrl: string;
}

interface SportGridProps {
    programs: SportProgram[];
    pageTitle: string;
}

export default function SportGrid({ programs, pageTitle }: SportGridProps) {
    const [activeProgram, setActiveProgram] = useState<SportProgram | null>(null);

    const openProgram = useCallback((program: SportProgram) => {
        setActiveProgram(program);
    }, []);

    const closeProgram = useCallback(() => {
        setActiveProgram(null);
    }, []);

    return (
        <div className={styles.wrapper}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>{pageTitle}</h1>
            </div>

            <div className={styles.separator} />

            {/* Program Cards */}
            <div className={styles.list}>
                {programs.map((program) => (
                    <div key={program.id}>
                        <div
                            className={styles.card}
                            role="button"
                            tabIndex={0}
                            onClick={() => openProgram(program)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    openProgram(program);
                                }
                            }}
                        >
                            <Image
                                src={program.thumbnail}
                                alt={program.title}
                                width={1400}
                                height={500}
                                className={styles.cardImage}
                            />
                            <div className={styles.cardOverlay}>
                                <h2 className={styles.cardTitle}>
                                    {program.title}
                                </h2>
                                <p className={styles.cardSubtitle}>
                                    {program.subtitle}
                                </p>
                                <button
                                    type="button"
                                    className={styles.cardBtn}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openProgram(program);
                                    }}
                                >
                                    View The Program
                                </button>
                            </div>
                        </div>
                        <div className={styles.separator} />
                    </div>
                ))}
            </div>

            <VideoPopup
                isOpen={Boolean(activeProgram)}
                title={activeProgram?.title ?? ""}
                videoUrl={activeProgram?.videoUrl ?? ""}
                onClose={closeProgram}
            />
        </div>
    );
}
