// src/data/restaurant.js
// This file should export restaurant data, not define models

module.exports = {
    name: 'Ristorante Villa Petriolo',
    description: 'Ristorante gourmet con autentica cucina toscana e ingredienti locali',
    openingHours: {
        lunch: {
            start: '12:30',
            end: '14:30',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        dinner: {
            start: '19:30',
            end: '22:30',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
    },
    menu: {
        antipasti: [
            {
                name: 'Tagliere di salumi toscani',
                description: 'Selezione di salumi locali con crostini toscani',
                price: 18,
                available: true
            },
            {
                name: 'Crostini misti',
                description: 'Crostini con fegatini, pomodoro e funghi porcini',
                price: 14,
                available: true
            },
            {
                name: 'Burrata con pomodorini',
                description: 'Burrata fresca con pomodorini e basilico',
                price: 16,
                available: true
            }
        ],
        primi: [
            {
                name: 'Pappardelle al cinghiale',
                description: 'Pasta fresca con ragù di cinghiale',
                price: 22,
                available: true
            },
            {
                name: 'Risotto ai funghi porcini',
                description: 'Risotto con funghi porcini freschi',
                price: 24,
                available: true
            },
            {
                name: 'Ribollita toscana',
                description: 'Zuppa tradizionale toscana con pane, cavolo nero e fagioli',
                price: 18,
                available: true
            }
        ],
        secondi: [
            {
                name: 'Bistecca alla fiorentina',
                description: 'Classica bistecca di manzo chianina (min. 2 persone)',
                price: 8,  // prezzo per 100g
                available: true
            },
            {
                name: 'Cinghiale in umido',
                description: 'Cinghiale in umido con olive e erbe aromatiche',
                price: 28,
                available: true
            },
            {
                name: 'Filetto di branzino',
                description: 'Filetto di branzino con verdure di stagione',
                price: 30,
                available: true
            }
        ],
        dolci: [
            {
                name: 'Panna cotta',
                description: 'Panna cotta con frutti di bosco',
                price: 12,
                available: true
            },
            {
                name: 'Cantucci e Vin Santo',
                description: 'Biscotti tipici toscani con vino dolce',
                price: 14,
                available: true
            },
            {
                name: 'Torta al cioccolato',
                description: 'Torta al cioccolato con gelato alla vaniglia',
                price: 13,
                available: true
            }
        ]
    },
    wineList: [
        {
            name: 'Chianti Classico Riserva',
            producer: 'Villa Petriolo',
            year: 2018,
            price: 60,
            available: true
        },
        {
            name: 'Brunello di Montalcino',
            producer: 'Tenuta Il Poggione',
            year: 2016,
            price: 90,
            available: true
        },
        {
            name: 'Vernaccia di San Gimignano',
            producer: 'Panizzi',
            year: 2021,
            price: 45,
            available: true
        }
    ],
    specialEvents: [
        {
            name: 'Cena con lo Chef',
            description: 'Cena speciale con menu degustazione e incontro con lo chef',
            price: 120,
            available: true,
            schedule: {
                days: ['Friday'],
                time: '20:00'
            }
        },
        {
            name: 'Degustazione Vini',
            description: 'Degustazione guidata dei vini della tenuta',
            price: 50,
            available: true,
            schedule: {
                days: ['Wednesday', 'Saturday'],
                time: '18:00'
            }
        }
    ]
};