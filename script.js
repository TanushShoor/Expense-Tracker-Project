// script.js
const auth = firebase.auth();

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

const provider = new firebase.auth.GoogleAuthProvider();

function signInWithGoogle() {
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            loadAppContent(user);
        })
        .catch((error) => {
            console.error("Error signing in:", error);
            const errorCode = error.code;
            const errorMessage = error.message;
        });
}

function signUpWithGoogle() {
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // You can store additional user data in Firestore if needed
            // db.collection('users').doc(user.uid).set({ /* ... */ });
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            loadAppContent(user);
        })
        .catch((error) => {
            console.error("Error signing up:", error);
        });
}

function loadAppContent(user) {
    fetch('expense_tracker.html')
        .then(response => response.text())
        .then(html => {
            appContainer.innerHTML = html;
            initializeExpenseTracker(user);
        });
}

function initializeExpenseTracker(user) {
    const apiKey = '6b1590f7a3a5429fa398154cea74f15b';
    let exchangeRates = {};
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    async function fetchExchangeRates() { // Same as before
        try {
            const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            exchangeRates = data.rates;
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            alert("Error fetching exchange rates. Currency conversion may not work correctly.");
        }
    }

    function addExpense(amount, category, currency, description) { // Same as before
        if (isNaN(amount)) {
            alert("Please enter a valid number for the amount.");
            return;
        }
        const convertedAmount = convertCurrency(amount, currency, 'USD');
        expenses.push({
            amount: convertedAmount,
            category,
            currency,
            description,
        });
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpenseList();
        updateChart();
    }

    function updateExpenseList() { // Same as before
        const expenseList = document.getElementById('expense-list');
        expenseList.innerHTML = '';
        expenses.forEach(expense => {
            const item = document.createElement('li');
            item.textContent = `${expense.description} - ${expense.amount} USD (${expense.category})`;
            expenseList.appendChild(item);
        });
    }

    function convertCurrency(amount, fromCurrency, toCurrency) { // Same as before
        if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return amount;
        return (amount / exchangeRates[fromCurrency]) * exchangeRates[toCurrency];
    }

    function calculateCategoryBreakdown() { // Same as before
        const breakdown = {};
        expenses.forEach(expense => {
            if (typeof expense.amount !== 'number' || typeof expense.category !== 'string') {
                console.error('Invalid expense data', expense);
                return;
            }
            if (!breakdown[expense.category]) {
                breakdown[expense.category] = 0;
            }
            breakdown[expense.category] += expense.amount;
        });
        return breakdown;
    }

    function updateChart() { // Same as before
        const breakdown = calculateCategoryBreakdown();
        const categories = Object.keys(breakdown);
        const amounts = Object.values(breakdown);

        const ctx = document.getElementById('expense-chart').getContext('2d');

        if (window.expenseChart) {
            window.expenseChart.data.labels = categories;
            window.expenseChart.data.datasets[0].data = amounts;
            window.expenseChart.update();
        } else {
            window.expenseChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: categories,
                    datasets: [{
                        label: 'Expenses by Category',
                        data: amounts,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40'],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function (tooltipItem) {
                                    return `${tooltipItem.label}: $${tooltipItem.raw.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    const expenseForm = document.getElementById('expense-form'); // Same as before
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const currency = document.getElementById('currency').value;
        const description = document.getElementById('description').value;

        addExpense(amount, category, currency, description);
        expenseForm.reset();
    });

    fetchExchangeRates().then(() => { // Same as before
        updateExpenseList();
        updateChart();
    });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        loadAppContent(user);
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});