// Appwrite Configuration for DNK Project
const { Client, Account, Databases, Storage } = Appwrite;

const client = new Client();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') // Default for Cloud
    .setProject('694124d500073b6d8409'); // Replace with your Project ID

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// IDs (Replace with your actual IDs from Appwrite Console)
const DATABASE_ID = '69413222000aa93c99fc';
const COLLECTION_ID = 'projects';
const BUCKET_ID = '694131c000079f447b4f';

// Expose to window for other scripts
window.client = client;
window.account = account;
window.databases = databases;
window.storage = storage;
window.DATABASE_ID = DATABASE_ID;
window.COLLECTION_ID = COLLECTION_ID;
window.BUCKET_ID = BUCKET_ID;

console.log("Appwrite Initialized & Globals Set");
