# Chatbox
sudo apt update
sudo apt install redis-server redis-cli
ping tải redis
cd ..
cd E:/Redis
.\redis-server.exe

# Backend
pip install channels channels_redis daphne
python manage.py runserver
daphne chatproject.asgi:application
