// helper to download an image URL in different formats
export async function downloadImageAs(url, format = 'png') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        if (format === 'pdf') {
          // dynamic import to keep bundle small
          import('jspdf').then(({ jsPDF }) => {
            const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save('image.pdf');
            resolve();
          }).catch(reject);
          return;
        }

        const mime = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mime);
        const link = document.createElement('a');
        link.href = dataUrl;
        const ext = format === 'jpg' ? 'jpg' : format === 'jpeg' ? 'jpg' : 'png';
        link.download = `image.${ext}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = url;
    // if cached and complete already
    if (img.complete) img.onload();
  });
}
