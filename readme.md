# GearGuard: The Ultimate Maintenance Tracker

GearGuard is a maintenance management system designed to track company assets (machines, vehicles, computers) and manage maintenance requests. It connects Equipment (what is broken) with Maintenance Teams (who fixes it) through a robust workflow of Requests.

This project functions as an API backend built with **Flask** and **PostgreSQL**, capable of supporting a frontend similar to Odoo's maintenance module.

## 🚀 Features

* **Equipment Management:** Track assets with details like Serial Number, Category, Location, and Health Percentage.
* **Maintenance Requests:**
    * **Corrective:** Unplanned repairs (Breakdowns).
    * **Preventive:** Scheduled routine checkups.
* **Workflow Logic:** Kanban-style stages (New Request -> In Progress -> Repaired -> Scrap).
* **Team Management:** Assign technicians and teams to specific equipment.
* **Dashboard Analytics:** Track critical equipment (<30% health), overdue tasks, and open requests.
* **JWT Authentication:** Secure login for Admins, Technicians, and Employees.

## 🛠️ Tech Stack

* **Language:** Python 3.x
* **Framework:** Flask
* **Database:** PostgreSQL
* **ORM:** SQLAlchemy
* **Authentication:** PyJWT
* **Testing:** Python `requests` library

## 📋 Prerequisites

* Python 3.8+
* PostgreSQL installed and running locally.

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd GearGuard