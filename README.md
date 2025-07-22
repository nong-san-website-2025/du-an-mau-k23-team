# Chatbox 
cd .. <br>
sudo apt update <br>
sudo apt install redis-server redis-cli <br>
ping tải redis <br>
cd .. <br>
cd E:/Redis <br>
.\redis-server.exe 

# Backend
pip install channels channels_redis daphne <br>
python manage.py runserver <br>
ctrl C <br>
daphne chatproject.asgi:application
