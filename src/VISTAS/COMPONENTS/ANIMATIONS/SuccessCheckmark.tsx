import styles from './SuccessCheckmark.module.css';

/** Dibuja el círculo y el tic, completa el fondo y cierra con un pequeño pulso. */
export function SuccessCheckmark({ size = 100 }: { size?: number }) {
  return (
    <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width={size} height={size} aria-hidden="true" focusable="false">
      <circle className={styles.circle} cx="26" cy="26" r="25" />
      <path className={styles.check} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
    </svg>
  );
}
