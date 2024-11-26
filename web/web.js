document.getElementById('packageForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    Package_Tracking = {
      Package_Name: document.getElementById('packageName').value,
      Send_Date: document.getElementById('sendDate').value,
      Deliver_From: document.getElementById('deliverFrom').value,
      Delivered_Location: document.getElementById('deliveredLocation').value,
      Description: document.getElementById('description').value,
      Package_weight_in_kgs: parseFloat(document.getElementById('weight').value),
      Price: parseFloat(document.getElementById('price').value),
    };
  
    // POST data to the Node.js API
    await fetch('/api/packages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Package_Tracking),
    });
  
    // Reload the package list
    loadPackages();
  });
  
  async function loadPackages() {
    const response = await fetch('/api/packages');
    const packages = await response.json();
  
    const packageList = document.getElementById('packageList');
    packageList.innerHTML = ''; // Clear the list
  
    if (packages.length === 0) {
      packageList.innerHTML = '<p>No packages tracked yet.</p>';
      return;
    }
  
    packages.forEach((pkg) => {
      const packageDiv = document.createElement('div');
      packageDiv.classList.add('package');
      packageDiv.innerHTML = `
        <h3>${pkg.Package_Name}</h3>
        <p><strong>Send Date:</strong> ${pkg.Send_Date}</p>
        <p><strong>From:</strong> ${pkg.Deliver_From}</p>
        <p><strong>To:</strong> ${pkg.Delivered_location}</p>
        <p><strong>Description:</strong> ${pkg.Description}</p>
        <p><strong>Weight:</strong> ${pkg.Package_weight_kgs} kg</p>
        <p><strong>Price:</strong> $${pkg.Price.toFixed(2)}</p>
      `;
      packageList.appendChild(packageDiv);
    });
  }
  

  loadPackages();
  