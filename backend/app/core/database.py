from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base
from pathlib import Path
import os
from dotenv import load_dotenv

#ESTABLISHING CONNECTION WITH THE DATABASE
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
database_url = os.getenv("DATABASE_URL")
if(database_url is None):
   raise ValueError("Url not found in env variables file.")
engine = create_engine(database_url, echo=True)
#CREATING SESSION
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
#OPENING THE CONNECTION
def get_db():
    db = SessionLocal()
    try:# TRY TO OPEN IT AND IF YOU DO STAY CONNECTED
        yield db 
    finally: #CLOSE IT WHEN ITS DONE
        db.close()