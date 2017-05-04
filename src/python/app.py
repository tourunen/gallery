from bottle import route, run, static_file

@route('/')
def server_static():
    return static_file('index.html', root='/opt/app-root/www')


@route('/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root='/opt/app-root/www/public')


@route('/healthz')
def health():
    return 'OK!'


run(host='0.0.0.0', port=8080)
