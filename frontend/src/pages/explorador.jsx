import React, { useState, useEffect } from 'react';  
import { Layout, Breadcrumb, Button, Card, Row, Col, Typography, Divider, Drawer, Modal, Form, message, Input, Tooltip } from 'antd';  
import { FcDoughnutChart, FcFolder, FcDocument } from "react-icons/fc";  
import { FaTerminal, FaUser } from "react-icons/fa";  
import { ImExit } from "react-icons/im";  

const { Content } = Layout;  
const { Title, Text } = Typography;  
const { TextArea } = Input;  

export function Explorador() {  
    const [discos, setDiscos] = useState([]);  
    const [currentPath, setCurrentPath] = useState('Root');  
    const [openDrawer, setOpenDrawer] = useState(false);  
    const [command, setCommand] = useState('');  
    const [result, setResult] = useState('');  
    const [openModal, setOpenModal] = useState(false);  
    const [loading, setLoading] = useState(false);  
    const [form] = Form.useForm();  
    const [particiones, setParticiones] = useState([]);  
    const [files, setFiles] = useState([]);  
    const [isLoggedIn, setIsLoggedIn] = useState(false);  
    const [fileContent, setFileContent] = useState('');  
    const [view, setView] = useState('discos'); // Estado para controlar la vista actual  

    // Cargar discos al iniciar  
    useEffect(() => {  
        const fetchDiscos = async () => {  
            try {  
                const response = await fetch('http://52.14.175.139:8080/discos', {  
                    method: 'GET',  
                    headers: {  
                        'Content-Type': 'application/json',  
                    }  
                });  

                if (!response.ok) {  
                    throw new Error('Error en la solicitud');  
                }  

                const data = await response.json();  
                console.log('Discos recibidos:', data);  
                setDiscos(Array.isArray(data) ? data : []); // Asegúrate de que sea un array  
            } catch (error) {  
                console.error('Error:', error);  
                message.error('Error al cargar los discos.');  
            }  
        };  
        fetchDiscos();  
    }, []);  

    // Manejar clic en el disco  
    const onCardClick = async (disco) => {  
        setCurrentPath(disco.Nombre);  

        try {  
            const response = await fetch(`http://52.14.175.139:8080/particiones?rutaDisco=${encodeURIComponent(disco.Ruta)}`, {  
                method: 'GET',  
                headers: {  
                    'Content-Type': 'application/json',  
                }  
            });  

            if (!response.ok) {  
                throw new Error('Error en la solicitud');  
            }  

            const data = await response.json();  
            console.log('Particiones recibidas:', data);  
            setParticiones(Array.isArray(data) ? data : []); // Asegúrate de que sea un array  
            setView('particiones');  
        } catch (error) {  
            console.error('Error:', error);  
            message.error('Error al obtener particiones.');  
        }  
    };  

    // Manejar clic en una partición para obtener archivos  
    const onParticionClick = async (particion) => {  
        setCurrentPath(particion.Nombre);  

        try {  
            const response = await fetch(`http://52.14.175.139:8080/files?idParticion=${particion.IDParticion}`, {  
                method: 'GET',  
                headers: {  
                    'Content-Type': 'application/json',  
                }  
            });  

            if (!response.ok) {  
                throw new Error('Error en la solicitud');  
            }  

            const data = await response.json();  
            console.log('Archivos recibidos:', data);  
            if (Array.isArray(data) && data.length > 0) {  
                setFiles(data);  
                setView('archivos');  
            } else {  
                message.warning('No se encontraron archivos.');  
            }  
        } catch (error) {  
            console.error('Error:', error);  
            message.error('Error al obtener archivos.');  
        }  
    };  

    // Manejar clic en un archivo  
    const onFileClick = async (file) => { 
      console.log("entro")
      console.log(file.type) 
        if (file.type === 'File') {  
            try {  
                const response = await fetch(`http://52.14.175.139:8080/file-content?path=${encodeURIComponent(file.path)}`, {  
                    method: 'GET',  
                    headers: {  
                        'Content-Type': 'application/json',  
                    }  
                });  

                if (!response.ok) {  
                    throw new Error('Error al obtener el contenido del archivo');  
                }  

                const data = await response.json();  
                setFileContent(data.content || ''); // Manejo de fallback  
                setView('fileContent');  
            } catch (error) {  
                console.error('Error:', error);  
                message.error('Error al obtener el contenido del archivo.');  
            }  
        } else {  
            // Si es un directorio, manejar como antes  
            onParticionClick(file);  
        }  
    };  

    const handleBackToDiscos = () => {  
        setParticiones([]);  
        setFiles([]);  
        setCurrentPath('Root');  
        setView('discos');  
    };  

    const handleBackToParticiones = () => {  
        setFiles([]);  
        setView('particiones');  
    };  

    const showDrawer = () => { setOpenDrawer(true); };  
    const onCloseDrawer = () => { setOpenDrawer(false); };  

    const handleExecute = async () => {  
        if (command.trim() === '') {  
            setResult('Por favor, ingresa un comando válido.');  
            return;  
        }  

        try {  
            const response = await fetch('http://52.14.175.139:8080/submit', {  
                method: 'POST',  
                headers: {  
                    'Content-Type': 'application/json',  
                },  
                body: JSON.stringify({ input: command }),  
            });  

            if (!response.ok) {  
                throw new Error('Error en la solicitud');  
            }  

            const data = await response.json();  
            setResult(data.output || ''); // Manejo de fallback  
        } catch (error) {  
            console.error('Error:', error);  
            setResult('Error al procesar comando: ' + error.message);  
        }  
    };  

    const showModal = () => setOpenModal(true);  
    const handleCancel = () => setOpenModal(false);  

    const handleLogin = async (values) => {  
        setLoading(true);  
        try {  
            const response = await fetch('http://52.14.175.139:8080/login', {  
                method: 'POST',  
                headers: {  
                    'Content-Type': 'application/json',  
                },  
                body: JSON.stringify({  
                    Usuario: values.username,  
                    Password: values.password,  
                    IDParticion: values.idpartition  
                }),  
            });  

            if (!response.ok) {  
                throw new Error('Error en la solicitud de login');  
            }  

            const data = await response.json();  
            console.log('Respuesta del servidor:', data);  

            if (data.success === true) {  
                message.success('Inicio de sesión exitoso');  
                setIsLoggedIn(true);  
                setOpenModal(false);  
            } else {  
                message.error('Usuario o contraseña incorrectos');  
            }  
        } catch (error) {  
            console.error('Error:', error);  
            message.error('Error al intentar iniciar sesión');  
        } finally {  
            setLoading(false);  
        }  
    };  

    const handleLogout = async () => {  
        try {  
            const response = await fetch('http://52.14.175.139:8080/logout', {  
                method: 'POST',  
                headers: {  
                    'Content-Type': 'application/json',  
                }  
            });  

            if (!response.ok) {  
                throw new Error('Error en la solicitud de logout');  
            }  

            message.success('Cierre de sesión exitoso');  
            setIsLoggedIn(false);  
        } catch (error) {  
            console.error('Error:', error);  
            message.error('Error al intentar cerrar sesión');  
        }  
    };  

    return (  
        <Layout style={{ height: '100vh', paddingInline: 150, paddingBlock: 50 }}>  
            <Row>  
                <Col span={18}>  
                    <Title level={2}><span style={{ color: '#4096FF' }}>[MIA-P2]</span> Explorador de Archivos</Title>  
                </Col>  
                <Col span={6}>  
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'end' }}>  
                        <Button onClick={showDrawer} size='large' type='primary' danger>  
                            <FaTerminal size={20} /> Abrir Consola  
                        </Button>  
                        <Button onClick={showModal} size='large' type='primary' style={{ marginInline: 20 }} disabled={isLoggedIn}>  
                            <FaUser size={18} /> Iniciar Sesión  
                        </Button>  
                        <Button onClick={handleLogout} size='large' type='primary' disabled={!isLoggedIn}>  
                            <ImExit size={18} /> Cerrar Sesión  
                        </Button>  
                    </div>  
                </Col>  
            </Row>  

            <Row gutter={10} style={{ marginBlock: 10 }}>  
                <Col span={10}>  
                    <Breadcrumb style={{ fontSize: 16, backgroundColor: 'white', padding: 8, borderRadius: 5 }}>  
                        <Breadcrumb.Item>Root</Breadcrumb.Item>  
                        <Breadcrumb.Item>{currentPath}</Breadcrumb.Item>  
                    </Breadcrumb>  
                </Col>  
            </Row>  
            <Divider style={{ marginTop: 0 }} />  

            <Content>  
                {view === 'discos' && (  
                    <Row gutter={[16, 16]} style={{ height: 480, overflowY: 'scroll', overflowX: 'hidden' }}>  
                        {discos.length > 0 ? (  
                            discos.map((disco, index) => (  
                                <Col key={index} xs={24} sm={12} md={8} lg={6}>  
                                    <Card  
                                        hoverable  
                                        onClick={() => onCardClick(disco)}  
                                        cover={  
                                            <div style={{ padding: '24px', textAlign: 'center' }}>  
                                                <FcDoughnutChart size={100} />  
                                            </div>  
                                        }  
                                    >  
                                        <Tooltip title={disco.Nombre}>  
                                            <Card.Meta  
                                                title={<Text style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{disco.Nombre}</Text>}  
                                            />  
                                        </Tooltip>  
                                    </Card>  
                                </Col>  
                            ))  
                        ) : (  
                            <Row justify="center" style={{ height: 480, alignItems: 'center' }}>  
                                <Col>  
                                    <Text>No se encontraron discos.</Text>  
                                </Col>  
                            </Row>  
                        )}  
                    </Row>  
                )}  

                {view === 'particiones' && (  
                    <>  
                        <Button onClick={handleBackToDiscos} style={{ marginBottom: '20px' }}>  
                            Volver a Discos  
                        </Button>  
                        <Row gutter={[16, 16]} style={{ height: 480, overflowY: 'scroll', overflowX: 'hidden' }}>  
                            {particiones.length > 0 ? (  
                                particiones.map((particion) => (  
                                    <Col key={particion.IDParticion} xs={24} sm={12} md={8} lg={6}>  
                                        <Card hoverable onClick={() => onParticionClick(particion)}>  
                                            <Card.Meta title={particion.Nombre} description={`Ruta: ${particion.RutaDisco}`} />  
                                        </Card>  
                                    </Col>  
                                ))  
                            ) : (  
                                <Row justify="center" style={{ height: 480, alignItems: 'center' }}>  
                                    <Col>  
                                        <Text>No se encontraron particiones.</Text>  
                                    </Col>  
                                </Row>  
                            )}  
                        </Row>  
                    </>  
                )}  

                {view === 'archivos' && (  
                    <>  
                        <Button onClick={handleBackToParticiones} style={{ marginBottom: '20px' }}>  
                            Volver a Particiones  
                        </Button>  
                        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>  
                            {files.length > 0 ? (  
                                files.map((file) => (  
                                    <Col key={file.ID} xs={24} sm={12} md={8} lg={6}>  
                                        <Card hoverable onClick={() => onFileClick(file)}>  
                                            <Card.Meta  
                                                title={  
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>  
                                                        {file.type === 'DIR' ? <FcFolder size={40} /> : <FcDocument size={40} />}  
                                                        <span style={{ marginTop: 8 }}>{file.path || 'Sin ruta disponible'}</span>  
                                                    </div>  
                                                }  
                                                description={file.type}  
                                            />  
                                        </Card>  
                                    </Col>  
                                ))  
                            ) : (  
                                <Row justify="center" style={{ height: 480, alignItems: 'center' }}>  
                                    <Col>  
                                        <Text>No se encontraron archivos.</Text>  
                                    </Col>  
                                </Row>  
                            )}  
                        </Row>  
                    </>  
                )}  

                {view === 'fileContent' && (  
                    <div>  
                        <Button onClick={handleBackToParticiones} style={{ marginBottom: '20px' }}>  
                            Volver a Particiones  
                        </Button>  
                        <Title level={4}>Contenido del Archivo</Title>  
                        <Text>{fileContent}</Text>  
                    </div>  
                )}  
            </Content>  

            <Drawer title="Terminal" onClose={onCloseDrawer} open={openDrawer}>  
                <Title level={4}>Ingresa el Comando</Title>  
                <TextArea  
                    rows={4}  
                    placeholder="Escribe tu comando aquí :3"  
                    value={command}  
                    onChange={(e) => setCommand(e.target.value)}  
                />  
                <Button  
                    type="primary"  
                    style={{ marginTop: '10px' }}  
                    onClick={handleExecute}  
                >  
                    Ejecutar  
                </Button>  

                <div style={{ marginTop: '20px' }}>  
                    <Title level={5}>Resultado:</Title>  
                    <Text>{result}</Text>  
                </div>  
            </Drawer>  

            <Modal open={openModal} onCancel={handleCancel} footer={null}>  
                <Form form={form} name="login_form" onFinish={handleLogin} layout="vertical"  
                    style={{ paddingInline: 100, paddingBlock: 50 }}>  
                    <Title level={4}>Iniciar Sesión</Title>  
                    <Form.Item label="Id_Particion" name="idpartition" rules={[{ required: true, message: 'Por favor ingresa tu ID de partición!' }]}>  
                        <Input placeholder="Ingrese ID_particion" />  
                    </Form.Item>  
                    <Form.Item label="Usuario" name="username" rules={[{ required: true, message: 'Por favor ingresa tu usuario!' }]}>  
                        <Input placeholder="Ingrese su usuario" />  
                    </Form.Item>  

                    <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: 'Por favor ingresa tu contraseña!' }]}>  
                        <Input.Password placeholder="Ingrese su contraseña" />  
                    </Form.Item>  

                    <Form.Item>  
                        <Button type="primary" htmlType="submit" loading={loading} block>  
                            Entrar  
                        </Button>  
                    </Form.Item>  
                </Form>  
            </Modal>  
        </Layout>  
    );  
}
