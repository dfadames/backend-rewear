## Instrucciones de Instalación

### Instalación de Node.js LTS (v20.9.0):

1. Descargue el instalador de Node.js desde el sitio oficial de Node.js: [Descargar Node.js](https://nodejs.org/).

2. Seleccione la versión v20.9.0 de LTS y siga las instrucciones del instalador para completar la instalación de Node.js en su sistema.

3. Verifique que tiene la versión correcta escribiendo en una terminal:
   ```bash
   node -v
   ```
   Debería mostrarte la versión de Node.js que instalaste.

### Instalación de Docker Desktop (v4.25.0):

1. Para instalar Docker, descargue el instalador de Docker Desktop desde el sitio oficial de Docker: [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop).

2. Seleccione la versión v4.25.0 y siga las instrucciones del instalador para completar la instalación de Docker en su sistema.

3. Verifique que tiene la versión de Docker Desktop correcta seleccionando la rueda de opciones en la aplicación de Docker y seleccionando Software Updates.

4. Verifique que tiene la versión de Docker Engine correcta escribiendo en una terminal:

   ```bash
   docker -v
   ```

   Debería mostrarte "Docker version 24.0.6, build ed223bc" que es la versión de Docker Engine que viene con dicha versión de Docker Desktop.

### Clonar el Repositorio

Para empezar, se debe clonar el repositorio de GitHub en las máquinas locales utilizando el comando `git clone`.

### Instalar Dependencias de Node.js

Antes de ejecutar el proyecto, se debe instalar las dependencias de Node.js. Puede hacerse navegando hasta el directorio raíz del proyecto en la línea de comandos y ejecutando:

```bash
npm install
```

Este comando leerá el archivo package.json del proyecto, que lista todas las dependencias necesarias, y las instalará localmente.

### Iniciar la Aplicación

Finalmente, pueden iniciar la aplicación. Ya que se ha configurado el proyecto para usar ts-node-dev, se puede ejecutar:

```bash
npm run dev
```

Este comando inicializará el servidor y cada vez que se realice modificaciones en el código y se guarde, el servidor se reiniciará de automáticamente con los cambios para probarlos inmediatamente.
