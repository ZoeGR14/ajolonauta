import geojsonData from "./metro.json";
import terminales from "./terminales.json";

// Interfaces

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

// Metodos

export const euclidiana = (p1: Coordinate, p2: Coordinate): number =>
  Math.sqrt(
    Math.pow(p1.latitude - p2.latitude, 2) +
      Math.pow(p1.longitude - p2.longitude, 2)
  );

export const orderStations = (startStation: Station, stations: Station[]) => {
  let ordered = [startStation];
  let remaining = stations.filter(
    (s) =>
      s.latitude !== startStation.latitude ||
      s.longitude !== startStation.longitude
  );

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    const nearest = remaining.reduce((closest, s) =>
      euclidiana(last, s) < euclidiana(last, closest) ? s : closest
    );
    ordered.push(nearest);
    remaining = remaining.filter((s) => s !== nearest);
  }

  return ordered;
};

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

function construirGrafo(lineas: { estaciones: Station[] }[]) {
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

// Constantes

export const origin = {
  latitude: 19.45379117084108,
  longitude: -99.09783286973834,
  latitudeDelta: 0.583156553786452,
  longitudeDelta: 0.3156641498208046,
};

export const origin2 = {
  latitude: 19.435721,
  longitude: -99.08977903425694,
  latitudeDelta: 0.1,
  longitudeDelta: 0.2685099095106125,
};

export const lineas = [
  "Línea 1",
  "Línea 2",
  "Línea 3",
  "Línea 4",
  "Línea 5",
  "Línea 6",
  "Línea 7",
  "Línea 8",
  "Línea 9",
  "Línea A",
  "Línea B",
  "Línea 12",
];

export const lines = lineas
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

    const color = terminales.find((t) => t.linea === l)?.color;
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

export const arregloEstaciones = [
  ...new Set(lines.flatMap((l) => l.estaciones.map((e) => e.nombre))),
];

export const grafo = construirGrafo(lines);

export const mapStyle = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
