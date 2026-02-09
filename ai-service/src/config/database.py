import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv('DATABASE_HOST', 'localhost'),
                user=os.getenv('DATABASE_USER', 'root'),
                password=os.getenv('DATABASE_PASSWORD', ''),
                database=os.getenv('DATABASE_NAME', 'resume_screening'),
                pool_name='ai_service_pool',
                pool_size=5
            )
            if self.connection.is_connected():
                print("✅ Database connected successfully")
        except Error as e:
            print(f"❌ Database connection failed: {e}")
            raise e
    
    def disconnect(self):
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("Database connection closed")
    
    def get_connection(self):
        if not self.connection or not self.connection.is_connected():
            self.connect()
        return self.connection
    
    def execute_query(self, query, params=None):
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(query, params)
            if query.strip().upper().startswith('SELECT'):
                result = cursor.fetchall()
            else:
                connection.commit()
                result = cursor.lastrowid if cursor.lastrowid else cursor.rowcount
            return result
        except Error as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def execute_many(self, query, params_list):
        connection = self.get_connection()
        cursor = connection.cursor()
        try:
            cursor.executemany(query, params_list)
            connection.commit()
            return cursor.rowcount
        except Error as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()

# Create database instance
db = Database()
