// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('new_budget', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_budget', { autoIncrement: true });   
};

// upon successful
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run  
    if (navigator.online) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // create a transaction on your pending db with readwrite access
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access your pending object store
    const store = transaction.objectStore('new_budget');

    // add record to your store with add method
    store.add(record);
};

function checkDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(['new_budget'], 'readwrite');
    
    // access your pending object store
    const store = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        console.log(getAll.result)
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, textplain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // if successful, open a transaction on your pending db
                const transaction = db.transaction(['new_budget'], 'readwrite');

                // accesss your pending object store
                const store = transaction.objectStore('new_budget');

                // clear all itmes in your store
                store.clear();
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);