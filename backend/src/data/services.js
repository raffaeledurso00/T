module.exports = [
    {
        name: 'Transfer Aeroporto',
        description: 'Servizio di transfer da/per l\'aeroporto di Firenze',
        category: 'Transportation',
        price: 150,
        available: true,
        schedule: {
            startTime: '08:00',
            endTime: '22:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
    },
    {
        name: 'Pulizia Camera',
        description: 'Servizio di pulizia giornaliera della camera',
        category: 'Housekeeping',
        price: 0,
        available: true,
        schedule: {
            startTime: '09:00',
            endTime: '17:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
    },
    {
        name: 'Tour dei Vigneti',
        description: 'Visita guidata ai vigneti della tenuta con degustazione',
        category: 'Activities',
        price: 75,
        available: true,
        schedule: {
            startTime: '10:00',
            endTime: '13:00',
            days: ['Monday', 'Wednesday', 'Friday', 'Saturday']
        }
    },
    {
        name: 'Lezione di Cucina',
        description: 'Corso di cucina toscana tradizionale con lo chef',
        category: 'Activities',
        price: 120,
        available: true,
        schedule: {
            startTime: '15:00',
            endTime: '18:00',
            days: ['Tuesday', 'Thursday', 'Saturday']
        }
    },
    {
        name: 'Massaggio in Spa',
        description: 'Massaggio rilassante di 60 minuti',
        category: 'Wellness',
        price: 90,
        available: true,
        schedule: {
            startTime: '10:00',
            endTime: '20:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        }
    },
    {
        name: 'Noleggio Biciclette',
        description: 'Noleggio biciclette per esplorare i dintorni',
        category: 'Activities',
        price: 25,
        available: true,
        schedule: {
            startTime: '09:00',
            endTime: '18:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
    }
]; 