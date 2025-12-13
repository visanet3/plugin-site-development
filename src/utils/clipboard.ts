export const copyToClipboard = async (text: string): Promise<boolean> => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    textArea.remove();
    if (successful) {
      return true;
    }
  } catch (err) {
    console.error('execCommand copy failed:', err);
  }
  
  textArea.remove();
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API failed:', err);
      return false;
    }
  }
  
  return false;
};
