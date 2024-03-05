document.getElementById("loader").style.display = "none";
async function encryptFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const password = document.getElementById('passwordInput').value;
  const loader = document.getElementById('loader');

  if (!file || !password) {
    alert('Please select a file and enter a password.');
    return;
  }

  loader.style.display = 'block';

  const reader = new FileReader();

  reader.onload = async function(event) {
    try {
      const dataArrayBuffer = event.target.result;
      const encryptedData = await encrypt(dataArrayBuffer, password);
      const encryptedFileBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const fileName = file.name + '.encrypted';
      downloadEncryptedFile(encryptedFileBlob, fileName);
      console.log('Encryption completed');
      alert('Encryption completed successfully.');
    } catch (error) {
      console.error('Encryption error:', error);
      alert('Encryption failed. Please try again.');
    } finally {
      loader.style.display = 'none';
    }
  };

  reader.onerror = function(event) {
    console.error('File read error:', event.target.error);
    alert('File read error. Please try again.');
    loader.style.display = 'none';
  };

  reader.readAsArrayBuffer(file);
  passwordInput.value = '';
}

function downloadEncryptedFile(blob, fileName) {
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = fileName;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}


async function decryptFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const password = document.getElementById('passwordInput').value;
  const loader = document.getElementById('loader');

  if (!file || !password) {
    alert('Please select a file and enter a password.');
    return;
  }

  loader.style.display = 'block';

  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const decryptedData = await decrypt(event.target.result, password);
      if (decryptedData !== null) {
        const blob = new Blob([decryptedData], { type: 'application/octet-stream' });
        const fileName = file.name.replace('.encrypted', '');
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        downloadLink.click(); // Trigger the download
        alert('Decryption completed successfully.');
      } else {
        alert('Decryption failed. Incorrect password or invalid file format.');
      }
    } catch (error) {
      console.error('Decryption error:', error);
      alert('Decryption failed. Incorrect password or invalid file format.');
    } finally {
      loader.style.display = 'none';
    }
  };

  reader.readAsArrayBuffer(file);
  passwordInput.value = '';
}
  

async function encrypt(data, password) {
  try {
    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(password);
    const key = await crypto.subtle.importKey(
      'raw',
      encodedPassword,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const algorithm = {
      name: 'AES-GCM',
      iv: iv
    };

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );

    const encryptedData = await crypto.subtle.encrypt(algorithm, derivedKey, data);

    // Create a buffer to hold the combined data
    const combinedDataLength = salt.length + iv.length + encryptedData.byteLength;
    const combinedData = new Uint8Array(combinedDataLength);

    // Copy salt, iv, and encrypted data into the combined buffer
    let offset = 0;
    combinedData.set(salt, offset);
    offset += salt.length;
    combinedData.set(iv, offset);
    offset += iv.length;
    new Uint8Array(combinedData.buffer, offset).set(new Uint8Array(encryptedData));

    return combinedData;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

async function decrypt(data, password) {
  try {
    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(password);
    const key = await crypto.subtle.importKey(
      'raw',
      encodedPassword,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 16 + 12);
    const encryptedData = data.slice(16 + 12);

    console.log('Encrypted data length:', encryptedData.length); // Add this line

    const algorithm = {
      name: 'AES-GCM',
      iv: iv
    };

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );

    const decryptedData = await crypto.subtle.decrypt(algorithm, derivedKey, encryptedData);
    return decryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}



function generateRandomPassword() {
    var passwordInput = document.getElementById("passwordInput");
    var length = 12; // Change the length of the generated password as needed
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    var password = "";
    for (var i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    passwordInput.value = password;
}
function togglePasswordVisibility() {
    var passwordInput = document.getElementById("passwordInput");
    var togglePasswordIcon = document.getElementById("togglePasswordIcon");
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePasswordIcon.classList.remove("fa-eye");
        togglePasswordIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        togglePasswordIcon.classList.remove("fa-eye-slash");
        togglePasswordIcon.classList.add("fa-eye");
    }
}
function copyPassword() {
  var password = document.getElementById("passwordInput").value;
  var tempInput = document.createElement("input");
  tempInput.setAttribute("type", "text");
  tempInput.setAttribute("value", password);
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
  alert("Password copied to clipboard!");
}
// Function to show loader
function showLoader() {
    document.getElementById("loader").style.display = "block";
}

// Function to hide loader
function hideLoader() {
    document.getElementById("loader").style.display = "none";
}
