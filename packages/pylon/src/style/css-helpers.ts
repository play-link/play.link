export function computedStyleValue(str: string) {
  if (str.indexOf('var(--') === 0) {
    const varName = `--${str.slice(6, -1)}`;
    return getComputedStyle(document.documentElement).getPropertyValue(varName);
  } else {
    return str;
  }
}

export function toClassName(object: Record<string, boolean>, className?: string): string {
  return (
    [
      // Collect keys from the object where the boolean value is true
      ...Object.entries(object)
        .filter(([, isActive]) => isActive)
        .map(([key]) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)),
      // Append the existing className, if provided
      className,
    ]
      // Remove empty/falsy entries
      .filter(Boolean)
      // Join all valid class names with a space
      .join(' ')
  );
}
