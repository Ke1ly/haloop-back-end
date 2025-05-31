export function createDialogClickHandler(
  dialogElement: HTMLDialogElement
): (event: MouseEvent) => void {
  return function handleDialogClick(event: MouseEvent): void {
    // const target = event.target as HTMLElement;
    const rect = dialogElement.getBoundingClientRect();

    // 檢查點擊是否在元素外部
    const isClickOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    // 開發模式下的除錯資訊
    if (process.env.NODE_ENV === "development") {
      console.log(`
          點擊座標: (${event.clientX}, ${event.clientY})
          對話框邊界: 
            左: ${rect.left}, 右: ${rect.right}
            上: ${rect.top}, 下: ${rect.bottom}
          點擊是否在元素外: ${isClickOutside}
        `);
    }

    // 如果點擊在對話框外部，關閉對話框
    if (isClickOutside) {
      dialogElement.close();
      dialogElement.classList.remove("show");
    }
  };
}
