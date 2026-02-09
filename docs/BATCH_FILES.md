# 🚀 AI Recruitment System - Windows Batch Files

## 📁 Batch Files Created

I've created 3 convenient batch files to easily manage your AI Recruitment System:

### 🎯 **1. `quick-start.bat`** - Complete Setup & Launch
**Use this for first-time setup or when dependencies might be missing**

**What it does:**
- ✅ Checks and installs missing Node.js dependencies
- ✅ Creates Python virtual environment if needed
- ✅ Installs Python packages if missing
- ✅ Creates and migrates database if not exists
- ✅ Starts all 3 services
- ✅ Opens browser automatically

**Usage:**
```cmd
double-click quick-start.bat
```

---

### 🚀 **2. `start-project.bat`** - Start All Services
**Use this for daily startup when everything is already installed**

**What it does:**
- ✅ Checks if MySQL is running (starts if needed)
- ✅ Starts Backend API on port 5000
- ✅ Starts AI Service on port 5001  
- ✅ Starts Frontend on port 3000
- ✅ Opens browser at http://localhost:3000
- ✅ Shows test account credentials

**Usage:**
```cmd
double-click start-project.bat
```

---

### 🛑 **3. `stop-project.bat`** - Stop All Services
**Use this to cleanly stop all running services**

**What it does:**
- ✅ Stops all Node.js processes (Backend + Frontend)
- ✅ Stops Python processes (AI Service)
- ✅ Leaves MySQL running (for convenience)

**Usage:**
```cmd
double-click stop-project.bat
```

---

## 🎮 **How to Use**

### **First Time Setup:**
1. Double-click `quick-start.bat`
2. Wait for all dependencies to install
3. Services will start automatically
4. Browser will open at http://localhost:3000

### **Daily Usage:**
1. Double-click `start-project.bat`
2. Services start in separate windows
3. Browser opens automatically

### **Stopping Services:**
1. Double-click `stop-project.bat`
2. All services stop cleanly

---

## 🔧 **What Each Batch File Does**

### `quick-start.bat` Flow:
```
1. Check backend/node_modules → npm install if missing
2. Check frontend/node_modules → npm install if missing  
3. Check ai-service/venv → create venv + pip install if missing
4. Check database → create + migrate if missing
5. Call start-project.bat
```

### `start-project.bat` Flow:
```
1. Check MySQL service → start if needed
2. Start Backend API (new window)
3. Start AI Service (new window) 
4. Start Frontend (new window)
5. Wait 10 seconds for services to start
6. Open browser at localhost:3000
7. Wait for user to press any key
8. Stop all services when done
```

### `stop-project.bat` Flow:
```
1. Kill all node.exe processes
2. Kill all python.exe processes
3. Keep MySQL running (optional)
```

---

## 🌐 **Service URLs**

After starting, you can access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000  
- **AI Service**: http://localhost:5001

---

## 🔑 **Test Accounts**

- **Recruiter**: recruiter1@techcorp.com / Password123!
- **Candidate**: candidate1@email.com / Password123!

---

## 📝 **Notes**

- All batch files open services in separate windows for easy monitoring
- MySQL is kept running even after stopping (for convenience)
- Database migration only runs if database doesn't exist
- Dependencies are only installed if missing
- Browser opens automatically when services are ready

---

**🎉 Your AI Recruitment System is now just a double-click away!**
