import { validateImageMagicBytes } from '../../src/common/utils/file-validator';
import * as fs from 'fs';
import * as path from 'path';

describe('File Validator (MIME & Magic-byte check)', () => {
  const tempDir = path.join(__dirname, 'temp_test_files');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should accept valid JPEG file with correct magic bytes (0xFF 0xD8 0xFF)', () => {
    const filePath = path.join(tempDir, 'valid.jpg');
    // JPEG header: FF D8 FF E0 00 10 4A 46
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    fs.writeFileSync(filePath, jpegBuffer);

    expect(() => validateImageMagicBytes(filePath, 'image/jpeg', 5242880)).not.toThrow();
  });

  it('should accept valid PNG file with correct magic bytes (0x89 0x50 0x4E 0x47...)', () => {
    const filePath = path.join(tempDir, 'valid.png');
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    fs.writeFileSync(filePath, pngBuffer);

    expect(() => validateImageMagicBytes(filePath, 'image/png', 5242880)).not.toThrow();
  });

  it('should reject fake file (e.g. text or script disguised as .jpg)', () => {
    const filePath = path.join(tempDir, 'fake.jpg');
    fs.writeFileSync(filePath, '<?php echo "evil"; ?>');

    expect(() => validateImageMagicBytes(filePath, 'image/jpeg', 5242880)).toThrow(
      'Invalid file format. Uploaded file is not a valid JPEG or PNG image.',
    );
  });

  it('should reject file that exceeds maximum 5MB size limit', () => {
    const filePath = path.join(tempDir, 'oversize.jpg');
    const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    // Create 6 MB buffer
    const bigBuffer = Buffer.concat([header, Buffer.alloc(6 * 1024 * 1024)]);
    fs.writeFileSync(filePath, bigBuffer);

    expect(() => validateImageMagicBytes(filePath, 'image/jpeg', 5 * 1024 * 1024)).toThrow(
      'File size exceeds maximum allowed limit of 5MB',
    );
  });
});
