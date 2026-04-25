"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function ContactForm() {
    const [submitting] = useState(false);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        // TODO: hook backend later
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <p className={styles.eyebrow}>Get in touch</p>
            <h2 className={styles.formHeading}>Send us a message</h2>

            <div className={styles.fieldRow}>
                <div className={styles.field}>
                    <label htmlFor="name" className={styles.label}>
                        Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="email" className={styles.label}>
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className={styles.input}
                    />
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="subject" className={styles.label}>
                    Subject
                </label>
                <input
                    id="subject"
                    name="subject"
                    type="text"
                    className={styles.input}
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="message" className={styles.label}>
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className={styles.textarea}
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
            >
                {submitting ? "Sending…" : "Send Message"}
            </button>
        </form>
    );
}
