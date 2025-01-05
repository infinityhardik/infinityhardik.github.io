// Global variable to store selected filters
let selectedFilters = {};

// Helper functions
function getAllKeys(data) {
    const keys = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => keys.add(key));
    });
    return Array.from(keys);
}

function getUniqueValues(data, key) {
    const values = new Set();
    data.forEach(item => {
        if (item[key]) values.add(item[key]);
    });
    return Array.from(values);
}

// Function to open the filter modal with debug logging
function openFilterModal() {
    
    // Check if filter options need to be populated
    const hasExistingOptions = document.querySelector('#list-tab').children.length > 0;
    
    if (!hasExistingOptions) {
        populateFilterOptions();
    }
    
    updateCheckboxStates();
    
    updateClearFiltersButtonStyle();
}

// Function to update checkbox states with debug logging
function updateCheckboxStates() {
    const tabContent = document.getElementById('nav-tabContent');
    
    Array.from(tabContent.children).forEach(tabPane => {
        const key = tabPane.id.replace('list-', '').replace(/-/g, ' ');
        
        const checkboxes = tabPane.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            const checkboxId = checkbox.id;
            // Extract the value correctly from the checkbox ID
            const value = checkbox.dataset.filterValue || checkboxId.split('filter-checkbox-')[1].split('-').slice(1).join('-');
            const shouldBeChecked = selectedFilters[key] && selectedFilters[key].includes(value);
            
            checkbox.checked = shouldBeChecked;
            
            const label = checkbox.nextElementSibling;
            if (shouldBeChecked) {
                label.style.fontWeight = 'bold';
            } else {
                label.style.fontWeight = 'normal';
                label.style.background = 'none';
            }
        });
    });
}


// Function to populate tab values with debug logging
function populateTabValues(key, tabPane) {
    
    if (!tabPane) {
        console.error('Tab pane is null for key:', key);
        return;
    }

    const safeKey = key.replace(/ /g, '-');
    const uniqueValues = getUniqueValues(productsData.productDirectory, key);
    
    // Clear existing content
    tabPane.innerHTML = '';
    
    uniqueValues.forEach((value, index) => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input me-1';
        const safeValue = value.replace(/ /g, '-');
        const checkboxId = `filter-checkbox-${safeKey}-${safeValue}`;
        checkbox.id = checkboxId;

        // Store key and value directly on the checkbox
        checkbox.dataset.filterKey = key;
        checkbox.dataset.filterValue = value;
        
        // Check if this value is currently selected
        const isChecked = selectedFilters[key] && selectedFilters[key].includes(value);
        checkbox.checked = isChecked;
        
        checkbox.addEventListener('change', function(e) {
            const filterKey = this.dataset.filterKey;
            const filterValue = this.dataset.filterValue;
            updateSelectedFilters(filterKey, filterValue);
        });
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.setAttribute('for', checkboxId);
        label.textContent = value;
        
        if (isChecked) {
            label.style.fontWeight = 'bold';
        }
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        tabPane.appendChild(checkboxDiv);
    });
    
}

// Function to populate filter options with debug logging
function populateFilterOptions() {
    const tabList = document.getElementById('list-tab');
    const tabContent = document.getElementById('nav-tabContent');
    
    tabList.innerHTML = '';
    tabContent.innerHTML = '';

    const allKeys = getAllKeys(productsData.productDirectory);

    allKeys.forEach((key, index) => {
        if (key !== 'Product' && key !== 'Group Alias' && key !== 'Prod. Category') {
            const safeKey = key.replace(/ /g, '-');
            
            // Create tab item
            const tabItem = document.createElement('a');
            tabItem.classList.add('list-group-item', 'list-group-item-action');
            if (index === 0) tabItem.classList.add('active');
            tabItem.id = `list-${safeKey}-list`;
            tabItem.setAttribute('data-bs-toggle', 'list');
            tabItem.href = `#list-${safeKey}`;
            tabItem.role = 'tab';
            tabItem.setAttribute('aria-controls', `list-${safeKey}`);
            tabItem.textContent = key;
            
            // Add click handler with debugging
            tabItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
        
                
                // Remove active classes
                tabList.querySelectorAll('.active').forEach(el => {
                    el.classList.remove('active');
                });
                
                tabContent.querySelectorAll('.active, .show').forEach(el => {
                    el.classList.remove('active', 'show');
                });
                
                // Add active class
                this.classList.add('active');
                
                // Show content
                const targetPaneId = this.getAttribute('href');
                const targetPane = document.querySelector(targetPaneId);
                
                if (targetPane) {
                    targetPane.classList.add('active', 'show');
                    populateTabValues(key, targetPane);
                } else {
                    console.error('Target pane not found:', targetPaneId);
                }
            });
            
            tabList.appendChild(tabItem);

            // Create content pane
            const tabPane = document.createElement('div');
            tabPane.classList.add('tab-pane', 'fade');
            if (index === 0) {
                tabPane.classList.add('show', 'active');
            }
            tabPane.id = `list-${safeKey}`;
            tabPane.role = 'tabpanel';
            tabPane.setAttribute('aria-labelledby', `list-${safeKey}-list`);
            
            tabContent.appendChild(tabPane);
            
            // Populate initial tab
            if (index === 0) {
                setTimeout(() => populateTabValues(key, tabPane), 0);
            }
        }
    });
    
}

// Function to update selected filters with debug logging
function updateSelectedFilters(key, value) {
    
    if (!selectedFilters[key]) {
        selectedFilters[key] = [];
    }

    const index = selectedFilters[key].indexOf(value);
    if (index > -1) {
        selectedFilters[key].splice(index, 1);
        if (selectedFilters[key].length === 0) {
            delete selectedFilters[key];
        }
    } else {
        selectedFilters[key].push(value);
    }

    
    // Force a re-render of all checkbox states
    const tabContent = document.getElementById('nav-tabContent');
    Array.from(tabContent.children).forEach(tabPane => {
        const paneKey = tabPane.id.replace('list-', '').replace(/-/g, ' ');
        if (tabPane.classList.contains('active')) {
            populateTabValues(paneKey, tabPane);
        }
    });
    
    updateClearFiltersButtonStyle();
}

// Function to apply filters with debug logging
function applyFilters() {
    
    if (Object.keys(selectedFilters).length === 0) {
        displayProducts(productsData.productDirectory);
        updateCheckboxStates();
        updateClearFiltersButtonStyle();
        return;
    }

    const filteredProducts = filterProductsBySelectedFilters(selectedFilters);
    
    displayProducts(filteredProducts);
}

// Function to clear filters with debug logging
function clearFilters() {
    selectedFilters = {};
    updateCheckboxStates();
    updateClearFiltersButtonStyle();
    applyFilters();
}

// Function to filter products
function filterProductsBySelectedFilters(filters) {
    return productsData.productDirectory.filter(product => {
        for (const key in filters) {
            if (!filters[key].includes(String(product[key]))) {
                return false;
            }
        }
        return true;
    });
}

// Function to update button styles
function updateClearFiltersButtonStyle() {
    const filterButton = document.getElementById('filterProductList');
    const clearFiltersButton = document.getElementById('clearFilters');
    const filtersActive = Object.keys(selectedFilters).length > 0;

    if (filtersActive) {
        filterButton.style.backgroundColor = 'darkblue';
        clearFiltersButton.style.backgroundColor = 'black';
        clearFiltersButton.style.color = 'white';
    } else {
        filterButton.style.backgroundColor = '';
        clearFiltersButton.style.backgroundColor = '';
        clearFiltersButton.style.color = '';
    }
}