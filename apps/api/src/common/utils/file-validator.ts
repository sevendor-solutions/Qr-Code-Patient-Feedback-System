import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

/**
 * Validates file MIME type and magic bytes for JPEG / PNG images.
 * Ensures the uploaded file is a genuine JPEG or PNG image and does not exceed max size.
 */
export function validateImageMagicBytes(filePath: string, originalMime: string, maxSizeBytes = 5242880) {
  if (!fs.existsSync(filePath)) {
    throw new BadRequestException('Uploaded file not found on server');
  }

  const stat = fs.statSync(filePath);
  if (stat.size > maxSizeBytes) {
    fs.unlinkSync(filePath);
    throw new BadRequestException(`File size exceeds maximum allowed limit of ${maxSizeBytes / (1024 * 1024)}MB`);
  }

  const buffer = Buffer.alloc(8);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (!isJpeg && !isPng) {
    fs.unlinkSync(filePath);
    throw new BadRequestException('Invalid file format. Uploaded file is not a valid JPEG or PNG image.');
  }

  if (isJpeg && !['image/jpeg', 'image/jpg'].includes(originalMime.toLowerCase())) {
    fs.unlinkSync(filePath);
    throw new BadRequestException('MIME type does not match actual JPEG content.');
  }

  if (isPng && originalMime.toLowerCase() !== 'image/png') {
    fs.unlinkSync(filePath);
    throw new BadRequestException('MIME type does not match actual PNG content.');
  }

  return true;
}
