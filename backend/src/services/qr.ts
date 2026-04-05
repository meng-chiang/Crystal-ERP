import QRCode from 'qrcode';

export async function generateQrPng(text: string): Promise<Buffer> {
  const buffer = await QRCode.toBuffer(text, {
    type: 'png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  return buffer;
}
