                    // Extract the actual file data from multipart buffer
                    let imageBuffer = null;
                    
                    // Parse multipart boundary
                    const boundaryMatch = bodyString.match(/------WebKitFormBoundary[A-Za-z0-9]+/);
                    if (boundaryMatch) {
                        const boundary = boundaryMatch[0];
                        
                        // Find the file part (Content-Type: image or application)
                        const filePartRegex = new RegExp(boundary + '[\s\S]*?Content-Type:\s*(image|application)[\s\S]*?\r\n\r\n([\s\S]*?)\r\n' + boundary);
                        const filePartMatch = buffer.toString('binary').match(filePartRegex);
                        
                        if (filePartMatch) {
                            // Extract binary data after headers
                            const headerEndIndex = buffer.indexOf('\r\n\r\n');
                            if (headerEndIndex !== -1) {
                                const dataStartIndex = headerEndIndex + 4;
                                const nextBoundaryIndex = buffer.indexOf(boundary, dataStartIndex);
                                if (nextBoundaryIndex !== -1) {
                                    // Extract only the image bytes (exclude boundary)
                                    const imageEndIndex = nextBoundaryIndex - 2; // Remove \r\n before boundary
                                    imageBuffer = buffer.slice(dataStartIndex, imageEndIndex);
                                    
                                    console.log('DEBUG: Extracted image buffer size:', imageBuffer.length);
                                    console.log('DEBUG: Original buffer size:', buffer.length);
                                }
                            }
                        }
                    }
                    
                    // Fallback: try to find image markers directly in buffer
                    if (!imageBuffer) {
                        // Find start of actual image data by looking for image headers
                        const imageHeaders = [
                            [0xFF, 0xD8, 0xFF], // JPEG
                            [0x89, 0x50, 0x4E, 0x47], // PNG  
                            [0x52, 0x49, 0x46, 0x46], // WEBP
                        ];
                        
                        for (let i = 0; i < buffer.length - 10; i++) {
                            for (const header of imageHeaders) {
                                if (header.every((byte, j) => buffer[i + j] === byte)) {
                                    // Found image start, now find end by looking for next boundary
                                    const remainingBuffer = buffer.slice(i);
                                    const boundaryBytes = Buffer.from('------WebKitFormBoundary', 'binary');
                                    const endIndex = remainingBuffer.indexOf(boundaryBytes);
                                    
                                    if (endIndex !== -1) {
                                        imageBuffer = remainingBuffer.slice(0, endIndex - 2); // Remove \r\n
                                    } else {
                                        imageBuffer = remainingBuffer.slice(0, -50); // Remove last 50 bytes (boundary + extra)
                                    }
                                    break;
                                }
                            }
                            if (imageBuffer) break;
                        }
                    }
                    
                    // Final validation - make sure we have valid image data
                    if (!imageBuffer || imageBuffer.length < 100) {
                        sendError(res, 400, 'No se pudo extraer los datos de la imagen del formulario multipart');
                        return;
                    }
                    
                    console.log('DEBUG: Final image buffer size:', imageBuffer.length, 'bytes');
                    
                    // Save the uploaded file physically (now with clean image data)
                    fs.writeFileSync(path.join(receiptsDir, finalFileName), imageBuffer);
