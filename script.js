// Add this line to include the pako library
// <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.3/pako.min.js"></script>

async function encryptFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const password = document.getElementById('passwordInput').value;

  if (!file || !password) {
    alert('Please select a file and enter a password.');
    return;
  }

  const reader = new FileReader();
  reader.onloadstart = function(event) {
    // Show progress indicator for encryption
    document.getElementById('encryptionProgress').style.display = 'block';
  };
  reader.onprogress = function(event) {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      document.getElementById('encryptionProgress').value = percentComplete;
    }
  };
  reader.onload = async function(event) {
    // Compress the file data
    const compressedData = pako.deflate(event.target.result);
    const encryptedData = await encrypt(compressedData, password);
    if (encryptedData !== null) {
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const downloadLink = document.getElementById('downloadLink');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = file.name + '.encrypted';
      downloadLink.innerHTML = `Download ${file.name}.encrypted`;
      downloadLink.style.display = 'block';
    } else {
      alert('Encryption failed. Please try again.');
    }
    // Hide progress indicator after encryption
    document.getElementById('encryptionProgress').style.display = 'none';
  };
  reader.readAsArrayBuffer(file);
}

async function decryptFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const password = document.getElementById('passwordInput').value;

  if (!file || !password) {
    alert('Please select a file and enter a password.');
    return;
  }

  const reader = new FileReader();
  reader.onloadstart = function(event) {
    // Show progress indicator for decryption
    document.getElementById('decryptionProgress').style.display = 'block';
  };
  reader.onprogress = function(event) {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      document.getElementById('decryptionProgress').value = percentComplete;
    }
  };
  reader.onload = async function(event) {
    const decryptedData = await decrypt(event.target.result, password);
    if (decryptedData !== null) {
      // Decompress the decrypted data
      const decompressedData = pako.inflate(decryptedData);
      const blob = new Blob([decompressedData], { type: 'application/octet-stream' });
      const downloadLink = document.getElementById('downloadLink');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = file.name.replace('.encrypted', '');
      downloadLink.innerHTML = `Download ${file.name.replace('.encrypted', '')}`;
      downloadLink.style.display = 'block';
    } else {
      alert('Decryption failed. Please check your password and try again.');
    }
    // Hide progress indicator after decryption
    document.getElementById('decryptionProgress').style.display = 'none';
  };
  reader.readAsArrayBuffer(file);
}

async function encrypt(data, password) {
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
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    data
  );
  return new Uint8Array([...salt, ...iv, ...new Uint8Array(encryptedData)]);
}

async function decrypt(data, password) {
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
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    encryptedData
  );
  return decryptedData;
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
  var passwordInput = document.getElementById("passwordInput");
  passwordInput.select();
  document.execCommand("copy");
  alert("Password copied to clipboard!");
}

