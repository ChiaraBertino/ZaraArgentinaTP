
CREATE DATABASE ZaraArgentina;
GO

USE ZaraArgentina;
GO

CREATE TABLE Provincias (
    id_provincia INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);
GO

CREATE TABLE Tiendas (
    id_tienda INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    id_provincia INT NOT NULL,
    CONSTRAINT FK_Tiendas_Provincias
        FOREIGN KEY (id_provincia) REFERENCES Provincias(id_provincia)
);
GO

CREATE TABLE Categorias (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);
GO

CREATE TABLE Productos (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    id_categoria INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Productos_Categorias
        FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria),
    CONSTRAINT CK_Productos_Precio CHECK (precio >= 0)
);
GO

CREATE TABLE Ventas (
    id_venta INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATE NOT NULL,
    id_tienda INT NOT NULL,
    CONSTRAINT FK_Ventas_Tiendas
        FOREIGN KEY (id_tienda) REFERENCES Tiendas(id_tienda)
);
GO

CREATE TABLE DetalleVenta (
    id_detalle INT IDENTITY(1,1) PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_DetalleVenta_Ventas
        FOREIGN KEY (id_venta) REFERENCES Ventas(id_venta),
    CONSTRAINT FK_DetalleVenta_Productos
        FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
    CONSTRAINT CK_DetalleVenta_Cantidad CHECK (cantidad > 0),
    CONSTRAINT CK_DetalleVenta_Precio CHECK (precio_unitario >= 0)
);
GO

CREATE TABLE Usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);
GO

INSERT INTO Usuarios (usuario, password_hash) 
VALUES ('chiara', '123456');
GO

