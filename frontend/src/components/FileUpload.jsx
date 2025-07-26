import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';

function FileUpload({ show, onClose, onFileSelect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Upload File</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          type="file"
          className="form-control mb-3"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
        />
        {selectedFile && (
          <div className="mb-3">
            {preview && <img src={preview} alt="Preview" className="img-fluid rounded mb-2" style={{ maxWidth: '200px' }} />}
            <p>File: {selectedFile.name}</p>
            <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedFile}>
          Upload
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default FileUpload;