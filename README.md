#Chatbox
sudo apt update
sudo apt install redis-server
redis-cli ping
tải redis 
cd ..
cd E/C:\\Redis
.\redis-server.exe
#backend
pip install channels channels_redis daphne
python manage.py runserver
daphne chatproject.asgi:application
