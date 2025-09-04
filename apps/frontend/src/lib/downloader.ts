/**
 * Triggers a file download in the browser.
 * @param url The URL of the file to download.
 * @param filename The desired name for the downloaded file.
 */
export const triggerFileDownload = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
