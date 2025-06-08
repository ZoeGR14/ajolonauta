import React, { useState } from "react";
import { StatusBar, StyleSheet, TextInput, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import geojsonData from "../../assets/data/metro.json";
import terminales from "../../assets/data/terminales.json";
import {
  euclidiana,
  lineas,
  mapStyle,
  orderStations,
  origin,
  polylines,
} from "./mapa";

// Definición de tipos
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Station extends Coordinate {
  nombre: string;
}

interface GraphNode {
  coordenada: Coordinate;
  conexiones: {
    nombre: string;
    peso: number;
    coordenadas: Coordinate;
  }[];
}

// PriorityQueue optimizada
class PriorityQueue<T> {
  private collection: [T, number][] = [];

  enqueue(element: [T, number]): void {
    this.collection.push(element);
    this.collection.sort((a, b) => a[1] - b[1]);
  }

  dequeue(): [T, number] | undefined {
    return this.collection.shift();
  }

  isEmpty(): boolean {
    return this.collection.length === 0;
  }
}

// Implementación de Dijkstra
export function dijkstra(
  graph: Record<
    string,
    {
      coordenada: { latitude: number; longitude: number };
      conexiones: {
        coordenadas: { latitude: number; longitude: number };
        nombre: string;
        peso: number;
      }[];
    }
  >,
  startNode: string,
  endNode: string
) {
  if (!graph[startNode] || !graph[endNode]) {
    return { distance: Infinity, path: [] };
  }

  const distances: Record<string, number> = {};
  const previousNodes: Record<string, string | null> = {};
  const priorityQueue = new PriorityQueue<string>();

  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
    previousNodes[node] = null;
  });

  distances[startNode] = 0;
  priorityQueue.enqueue([startNode, 0]);

  while (!priorityQueue.isEmpty()) {
    const current = priorityQueue.dequeue();
    if (!current) continue;
    const [currentNode, currentDistance] = current;

    if (currentDistance > distances[currentNode]) continue;

    if (currentNode === endNode) {
      const path: {
        nombre: string;
        coordenadas: { latitude: number; longitude: number };
      }[] = [];
      let tempNode: string | null = endNode;
      while (tempNode !== null) {
        const prevNode = previousNodes[tempNode];
        if (prevNode !== null) {
          const connection = graph[prevNode]?.conexiones.find(
            (conn) => conn.nombre === tempNode
          );
          if (connection) {
            path.unshift({
              nombre: tempNode,
              coordenadas: connection.coordenadas,
            });
          }
        } else if (graph[tempNode]) {
          path.unshift({
            nombre: tempNode,
            coordenadas: graph[tempNode]?.coordenada || {
              latitude: 0,
              longitude: 0,
            },
          });
        }
        tempNode = previousNodes[tempNode];
      }
      return { distance: distances[endNode], path };
    }

    graph[currentNode]?.conexiones.forEach(({ nombre, peso, coordenadas }) => {
      const distance = currentDistance + peso;
      if (distance < distances[nombre]) {
        distances[nombre] = distance;
        previousNodes[nombre] = currentNode;
        priorityQueue.enqueue([nombre, distance]);
      }
    });
  }

  return { distance: Infinity, path: [] };
}

// Construcción de grafo
function construirGrafo(
  lineas: { estaciones: Station[]; color: string; linea: string }[]
) {
  const grafo: Record<string, GraphNode> = {};

  lineas.forEach(({ estaciones }) => {
    estaciones.forEach((estacion, index) => {
      if (!grafo[estacion.nombre]) {
        grafo[estacion.nombre] = {
          conexiones: [],
          coordenada: {
            latitude: estacion.latitude,
            longitude: estacion.longitude,
          },
        };
      }

      if (index > 0) {
        const anterior = estaciones[index - 1];
        grafo[estacion.nombre].conexiones.push({
          nombre: anterior.nombre,
          peso: euclidiana(estacion, anterior),
          coordenadas: {
            latitude: anterior.latitude,
            longitude: anterior.longitude,
          },
        });
      }

      if (index < estaciones.length - 1) {
        const siguiente = estaciones[index + 1];
        grafo[estacion.nombre].conexiones.push({
          nombre: siguiente.nombre,
          peso: euclidiana(estacion, siguiente),
          coordenadas: {
            latitude: siguiente.latitude,
            longitude: siguiente.longitude,
          },
        });
      }
    });
  });

  return grafo;
}

const lines = lineas
  .map((l) => {
    const completa = geojsonData.features.filter((lines) =>
      lines.properties.routes.includes(l)
    );

    const terminal = terminales.find((t) => t.linea === l)?.nombre;
    let coordenadaInicial: Station = {
      latitude: 0,
      longitude: 0,
      nombre: "",
    };

    const coordenadas: Station[] = completa.map((linea) => {
      const [longitude, latitude] = linea.geometry.coordinates;
      return { latitude, longitude, nombre: linea.properties.name };
    });

    if (terminal) {
      const terminalData = completa.find(
        (linea) => linea.properties.name === terminal
      );
      if (terminalData) {
        const [longitude, latitude] = terminalData.geometry.coordinates;
        coordenadaInicial = { latitude, longitude, nombre: terminal };
      }
    }

    const color = terminales.find((t) => t.linea === l)?.color || "black";

    return {
      startStation: coordenadaInicial,
      stations: coordenadas,
      color,
      linea: l,
    };
  })
  .map((p) => ({
    estaciones: orderStations(p.startStation, p.stations),
    color: p.color,
    linea: p.linea,
  }));

export default function MisRutas() {
  //@ts-ignore
  const grafo = construirGrafo(lines);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const result = dijkstra(grafo, start, end);

  const coordenadas = result?.path.map((s) => ({
    latitude: s.coordenadas.latitude,
    longitude: s.coordenadas.longitude,
  }));

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          paddingTop: StatusBar.currentHeight,
          justifyContent: "center",
          gap: 10,
          paddingHorizontal: 20,
        }}
      >
        <TextInput
          style={{
            padding: 10,
            borderColor: "black",
            borderRadius: 3,
            borderWidth: 1,
          }}
          value={start}
          onChangeText={setStart}
          placeholder="Estación de Origen"
        />
        <TextInput
          style={{
            padding: 10,
            borderColor: "black",
            borderRadius: 3,
            borderWidth: 1,
          }}
          value={end}
          onChangeText={setEnd}
          placeholder="Estación de Destino"
        />
      </View>

      <View style={{ flex: 4 }}>
        <MapView
          style={{ width: "100%", height: "100%" }}
          initialRegion={origin}
          customMapStyle={mapStyle}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {polylines.map((p, index) => (
            <Polyline
              coordinates={p.estaciones}
              key={index}
              strokeWidth={5}
              strokeColor={p.color}
            />
          ))}
          {result?.path.map((r, i) => (
            <Marker coordinate={r.coordenadas} key={i} title={r.nombre} />
          ))}
          {coordenadas && coordenadas.length > 0 && (
            <Polyline
              coordinates={coordenadas}
              strokeWidth={5}
              strokeColor="blue"
            />
          )}
        </MapView>
      </View>
      {/**/}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
