"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

export default function Footer() {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    if (pathname === "/" || pathname.startsWith("/admin")) return null;

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <p className={styles.copyright}>
                    © 20sCreative {currentYear}. All rights reserved.
                </p>
                <div className={styles.links}>
                    <Link href="/privacy-policy">Privacy Policy</Link>
                    <span className={styles.separator}>|</span>
                    <Link href="/disclaimer">Disclaimer</Link>
                </div>
            </div>
        </footer>
    );
}
