package main

import (
	functions_test "backend/Functions"
	"backend/config"
	"backend/lexer"
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/rs/cors"
)

type RequestBody struct {
	Input string `json:"input"`
}

type ResponseBody struct {
	Output string `json:"output"`
}

type LoginRequest struct {
	IDParticion string `json:"idParticion"`
	Usuario     string `json:"usuario"`
	Password    string `json:"password"`
}

type LoginResponse struct {
	Success bool `json:"success"`
}

const cuenta = false

// Estructura para almacenar la información de permisos
type Permission struct {
	Path string `json:"path"`
	Type string `json:"type"`
	ID   string `json:"id"`
}

// Función para imprimir los permisos
func printPermissions(permissions []Permission) {
	for _, permission := range permissions {
		fmt.Printf("Path: %s, Type: %s, ID: %s\n", permission.Path, permission.Type, permission.ID)
	}
}

// Función para leer el archivo permissions.txt
func readPermissions() ([]Permission, error) {
	var permissions []Permission
	file, err := os.Open("permissions.txt")
	if err != nil {
		return nil, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, "|")
		if len(parts) == 4 {
			permissions = append(permissions, Permission{
				Path: parts[1],
				Type: parts[2],
				ID:   parts[3],
			})
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return permissions, nil
}

// Handler para obtener archivos y directorios según IDParticion
func filesHandler(w http.ResponseWriter, r *http.Request) {
	idParticion := r.URL.Query().Get("idParticion")
	permissions, err := readPermissions()
	if err != nil {
		http.Error(w, "Error al leer permisos", http.StatusInternalServerError)
		return
	}

	var filteredPermissions []Permission
	for _, perm := range permissions {
		if perm.ID == idParticion {
			filteredPermissions = append(filteredPermissions, perm)
		}
	}
	printPermissions(filteredPermissions)
	jsonData, err := json.Marshal(filteredPermissions)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Print(jsonData)
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

// Handler para obtener particiones por ruta de disco
func particionesHandler(w http.ResponseWriter, r *http.Request) {
	rutaDisco := r.URL.Query().Get("rutaDisco")
	var particionesFiltradas []functions_test.Particion
	functions_test.ListarParticiones()
	functions_test.BorrarParticiones()
	functions_test.CargarDatos()
	functions_test.ListarParticiones()
	// Filtrar particiones por ruta de disco
	for _, particion := range functions_test.Particiones {
		if particion.RutaDisco == rutaDisco {
			particionesFiltradas = append(particionesFiltradas, particion)
		}
	}

	// Convertir a JSON y enviar respuesta
	jsonData, err := json.Marshal(particionesFiltradas)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func discosHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodGet {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	jsonResponse, err := functions_test.ObtenerDiscosJSON()
	if err != nil {
		http.Error(w, "Error al obtener discos", http.StatusInternalServerError)
		return
	}
	w.Write([]byte(jsonResponse)) // Enviar la respuesta JSON
}

// New handler for logging out
func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}
	functions_test.LOGOUT()
	// Here you can add logic to clear session data or token if applicable
	functions_test.VERIFICARLOGIN = false // Reset login status

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
func submitHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}
	config.ErrorMessage = ""
	config.GeneralMessage = ""
	var reqBody RequestBody
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, "Error al leer el cuerpo de la solicitud", http.StatusBadRequest)
		return
	}
	output := ""
	output = "Salida procesada para: " + reqBody.Input

	inputLines := strings.Split(reqBody.Input, "\n")

	for _, line := range inputLines {
		lexer.ParseLine(line)
	}

	if config.ErrorMessage == "" {
		output = config.GeneralMessage
	} else {
		output = config.ErrorMessage
	}

	responseBody := ResponseBody{Output: output}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseBody)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {

	functions_test.VERIFICARLOGIN = false
	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var loginReq LoginRequest
	err := json.NewDecoder(r.Body).Decode(&loginReq)
	if err != nil {
		http.Error(w, "Error al leer el cuerpo de la solicitud", http.StatusBadRequest)
		return
	}

	// Aquí puedes añadir la lógica de autenticación real
	// Por simplicidad, asumiendo autenticación siempre exitosa
	functions_test.LOGIN(loginReq.Usuario, loginReq.Password, loginReq.IDParticion)

	response := LoginResponse{Success: functions_test.VERIFICARLOGIN}
	fmt.Println(response.Success)
	fmt.Println(response)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Handler para obtener el contenido del archivo
func fileContentHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	fmt.Println("Path recibido:", path) // Para depuración
	content, err := os.ReadFile(path)   // Asegúrate de que tengas los permisos adecuados
	if err != nil {
		http.Error(w, fmt.Sprintf("Error al leer el archivo: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"content": string(content),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	functions_test.LoadMount()
	functions_test.LoadMountedPartitionsFromFile()
	functions_test.PrintMountedPartitionsList2()
	functions_test.CargarDatos()
	functions_test.ListarDiscos()
	fmt.Println("-----------------------------------------")
	fmt.Println("-----------------------------aqui------------")
	functions_test.ListarParticiones()
	fmt.Println("------------------------------aqui-----------")
	fmt.Println("-----------------------------------------")
	mux := http.NewServeMux()
	mux.HandleFunc("/particiones", particionesHandler)
	mux.HandleFunc("/submit", submitHandler)
	mux.HandleFunc("/discos", discosHandler)
	mux.HandleFunc("/login", loginHandler)
	mux.HandleFunc("/logout", logoutHandler)
	mux.HandleFunc("/files", filesHandler)
	mux.HandleFunc("/file-content", fileContentHandler)
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Allows all origins
		AllowCredentials: false,         // Credentials are not allowed
	})
	handler := c.Handler(mux)
	http.ListenAndServe(":8080", handler)
}
