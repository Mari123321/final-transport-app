# DASHBOARD ARCHITECTURE DIAGRAM

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                            │
│              http://localhost:5173/dashboard                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
          ┌─────────▼────────┐ ┌───────▼────────┐
          │  API Calls       │ │  State Mgmt    │
          │  (Parallel)      │ │  (8 metrics)   │
          └─────────┬────────┘ └───────┬────────┘
                    │                   │
        ┌───────────┼───────────┐       │
        │           │           │       │
        ▼           ▼           ▼       ▼
    /api/        /api/        /api/   state
    clients      vehicles     trips    updates
        │           │           │       │
        └───────────┼───────────┼───────┘
                    │
        ┌───────────▼──────────┐
        │   BACKEND (Node.js)  │
        │   :5000              │
        └────────────────────┬─┘
                             │
                ┌────────────┴──────────┐
                │                       │
        ┌───────▼──────────┐  ┌────────▼────────┐
        │  Database        │  │  /api Endpoints │
        │  (SQLite)        │  │  (Sequelize)    │
        └──────────────────┘  └─────────────────┘
```

## Component Hierarchy

```
Dashboard (Main Component - 800 lines)
│
├── PageHeader
│   ├── Title "Dashboard"
│   └── Subtitle "Welcome back! Here's an overview..."
│
├── FilterSection
│   ├── Client Dropdown
│   ├── Start Date Picker
│   ├── End Date Picker
│   └── Clear Button
│
├── MetricsGrid (2 rows x 4 cols)
│   ├── MetricCard (Total Clients)
│   ├── MetricCard (Total Vehicles)
│   ├── MetricCard (Total Trips)
│   ├── MetricCard (Total Invoices)
│   ├── MetricCard (Total Bills)
│   ├── MetricCard (Total Revenue)
│   ├── MetricCard (Paid Amount)
│   └── MetricCard (Pending Amount)
│
├── AnalyticsSection
│   ├── InvoiceStatusChart (PieChart)
│   │   └── Recharts PieChart Component
│   └── TripsPerClientChart (BarChart)
│       └── Recharts BarChart Component
│
└── RecentActivitySection
    ├── RecentActivityTable (Trips)
    ├── RecentActivityTable (Invoices)
    └── RecentActivityTable (Bills)
```

## State Management

```
┌────────────────────────────────────────────────────────────────┐
│                    Dashboard State                              │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  metrics: {                                                     │
│    totalClients: 10,         ← from /api/clients              │
│    totalVehicles: 5,         ← from /api/vehicles             │
│    totalTrips: 45,           ← from /api/trips                │
│    totalInvoices: 8,         ← from /api/invoices             │
│    totalBills: 8,            ← from /api/bills                │
│    totalRevenue: 125000,     ← calculated sum                 │
│    totalPaid: 75000,         ← calculated sum                 │
│    totalPending: 50000       ← calculated diff                │
│  }                                                              │
│                                                                  │
│  loading: {                                                     │
│    metrics: false,           ← granular loading state          │
│    trips: false,                                               │
│    invoices: false,                                            │
│    bills: false,                                               │
│    analytics: false                                            │
│  }                                                              │
│                                                                  │
│  errors: {                                                      │
│    metrics: null,            ← error tracking per section      │
│    trips: null,                                                │
│    invoices: null,                                             │
│    bills: null,                                                │
│    analytics: null                                             │
│  }                                                              │
│                                                                  │
│  recentTrips: [ {...}, {...}, {...} ]    ← latest 5 records  │
│  recentInvoices: [ {...}, {...}, {...} ] ← latest 5 records  │
│  recentBills: [ {...}, {...}, {...} ]    ← latest 5 records  │
│                                                                  │
│  analyticsData: {                                              │
│    invoiceStatus: [                                            │
│      { name: "Paid", value: 3 },                              │
│      { name: "Partial", value: 2 },                           │
│      { name: "Unpaid", value: 3 }                             │
│    ],                                                           │
│    tripsPerClient: [                                           │
│      { name: "Client 1", trips: 12 },                         │
│      { name: "Client 2", trips: 8 },                          │
│      { name: "Client 3", trips: 6 }                           │
│    ]                                                            │
│  }                                                              │
│                                                                  │
│  filters: {                                                     │
│    clientId: "",             ← selected client                 │
│    startDate: "",            ← date range filter               │
│    endDate: ""               ← date range filter               │
│  }                                                              │
│                                                                  │
│  clients: [ {...}, {...}, ... ]  ← for dropdown options      │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

## API Call Flow (Parallel)

```
useEffect (on mount)
│
├─┬──────────────────────────────────────┐
│ │                                      │
│ ├─ fetchMetrics()                     │
│ │   └─ Promise.all([              ← Parallel calls
│ │       GET /api/clients,          ← 100ms
│ │       GET /api/vehicles,         ← 150ms
│ │       GET /api/trips,            ← 200ms
│ │       GET /api/invoices,         ← 180ms
│ │       GET /api/bills             ← 120ms
│ │     ]) ← Total: ~200ms
│ │   ├─ Calculate totalRevenue
│ │   ├─ Calculate totalPaid
│ │   └─ setMetrics({...})
│ │
│ ├─ fetchClients()
│ │   ├─ GET /api/clients
│ │   └─ setClients([...])
│ │
│ ├─ fetchRecentTrips()
│ │   ├─ GET /api/trips
│ │   └─ setRecentTrips([...].slice(0,5))
│ │
│ ├─ fetchRecentInvoices()
│ │   ├─ GET /api/invoices
│ │   └─ setRecentInvoices([...].slice(0,5))
│ │
│ ├─ fetchRecentBills()
│ │   ├─ GET /api/bills
│ │   └─ setRecentBills([...].slice(0,5))
│ │
│ └─ fetchAnalytics()
│     ├─ GET /api/invoices → calculate status
│     ├─ GET /api/trips → aggregate by client
│     └─ setAnalyticsData({...})
│
└─ Re-render with data
```

## Component Props Flow

```
Dashboard (Parent)
│
├─ MetricCard
│   ├─ title: string
│   ├─ value: number
│   ├─ icon: MUI Icon component
│   ├─ loading: boolean
│   ├─ color: string (#1976d2)
│   └─ subtitle?: string
│
├─ RecentActivityTable
│   ├─ title: string
│   ├─ data: array
│   ├─ loading: boolean
│   ├─ columns: array of {id, label, render}
│   └─ icon: MUI Icon component
│
└─ Charts (Recharts)
    ├─ PieChart
    │   ├─ data: array of {name, value}
    │   ├─ dataKey: "value"
    │   └─ children: [Pie, Cell, Tooltip]
    │
    └─ BarChart
        ├─ data: array of {name, trips}
        ├─ dataKey: "trips"
        └─ children: [CartesianGrid, XAxis, YAxis, Bar]
```

## Color Usage Map

```
┌──────────────────────────────────────────────────────┐
│              Color Usage in Dashboard                │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Primary (#1976d2)                                  │
│  ├─ MetricCard icons for: Clients, Bills, Vehicles │
│  ├─ Filter section styling                          │
│  ├─ Charts primary color                            │
│  └─ Table headers                                   │
│                                                       │
│  Secondary (#f57c00)                                │
│  ├─ MetricCard icons for: Trips                     │
│  └─ Accent elements                                 │
│                                                       │
│  Success (#388e3c)                                  │
│  ├─ MetricCard icons for: Invoices, Revenue        │
│  ├─ Status badge for "Paid"                         │
│  └─ Pie chart green slice                           │
│                                                       │
│  Warning (#ff9800)                                  │
│  ├─ MetricCard icons for: Pending Amount            │
│  ├─ Status badge for "Pending"/"Partial"           │
│  └─ Pie chart orange slice                          │
│                                                       │
│  Danger (#d32f2f)                                   │
│  ├─ Status badge for "Unpaid"                       │
│  └─ Pie chart red slice                             │
│                                                       │
│  Neutral (#757575)                                  │
│  ├─ Text color (secondary)                          │
│  └─ Status fallback color                           │
│                                                       │
│  Background (#f5f7fa)                               │
│  └─ Main page background                            │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

```
┌────────────────────────────────────────────────────────┐
│         Responsive Behavior by Screen Size             │
├────────────────────────────────────────────────────────┤
│                                                         │
│  xs (0-599px) - Mobile                                │
│  ├─ Metrics: 12 columns (1 per row)                   │
│  ├─ Charts: 12 columns (stacked)                      │
│  ├─ Tables: Horizontal scroll                         │
│  └─ Filters: Full width                               │
│                                                         │
│  sm (600-959px) - Tablet                              │
│  ├─ Metrics: 6 columns (2 per row)                    │
│  ├─ Charts: 6 columns each                            │
│  ├─ Tables: Full width                                │
│  └─ Filters: Full width                               │
│                                                         │
│  md (960-1279px) - Laptop                             │
│  ├─ Metrics: 3 columns (4 per row)                    │
│  ├─ Charts: 6 columns each (side by side)             │
│  ├─ Tables: Full width                                │
│  └─ Filters: 3 columns                                │
│                                                         │
│  lg (1280px+) - Desktop                               │
│  ├─ Metrics: 3 columns (4 per row)                    │
│  ├─ Charts: 6 columns each (side by side)             │
│  ├─ Tables: Full width                                │
│  └─ Filters: 3 columns                                │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Performance Optimization Strategies

```
┌─────────────────────────────────────────────────────┐
│        Performance Optimization Points              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  useCallback Memoization                            │
│  ├─ fetchMetrics (prevents re-creation)            │
│  ├─ fetchClients (prevents re-creation)            │
│  ├─ fetchRecentTrips (prevents re-creation)        │
│  ├─ fetchRecentInvoices (prevents re-creation)     │
│  ├─ fetchRecentBills (prevents re-creation)        │
│  └─ fetchAnalytics (prevents re-creation)          │
│                                                      │
│  Parallel API Calls                                 │
│  └─ Promise.all([...]) ← All 5 endpoints at once   │
│                                                      │
│  Selective Re-rendering                             │
│  ├─ Granular loading states per section             │
│  ├─ Only re-render changed sections                 │
│  └─ No full page re-renders                         │
│                                                      │
│  Data Slicing                                       │
│  ├─ Only fetch latest 5 records per table           │
│  ├─ Only show top 6 clients in chart                │
│  └─ Reduced DOM nodes                               │
│                                                      │
│  Chart Library                                      │
│  └─ Recharts ← Pre-optimized rendering              │
│                                                      │
│  Loading Skeletons                                  │
│  └─ Show immediately ← prevents layout shift        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
API Call
│
├─ Success ✓
│   ├─ Transform data
│   ├─ Update state
│   └─ Display results
│
└─ Error ✗
    ├─ Catch exception
    ├─ Set error state
    ├─ Display error message
    ├─ Show fallback value
    └─ Log to console
```

## File Organization

```
Dashboard.jsx (800 lines)
│
├─ Imports (40 lines)
│   ├─ React hooks
│   ├─ Material-UI components
│   ├─ Recharts components
│   └─ Axios HTTP client
│
├─ Constants (20 lines)
│   ├─ API_BASE
│   ├─ COLORS
│   └─ STATUS_COLORS
│
├─ Sub-components (150 lines)
│   ├─ MetricCard (50 lines)
│   ├─ EmptyState (25 lines)
│   └─ RecentActivityTable (75 lines)
│
├─ Main Dashboard Component (590 lines)
│   ├─ State declarations (60 lines)
│   ├─ API call functions (250 lines)
│   ├─ useEffect hooks (20 lines)
│   └─ JSX render (260 lines)
│
└─ Export (1 line)
```

---

This architecture provides a scalable, maintainable foundation for the Transport Management System dashboard!
