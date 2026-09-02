import java.util.HashMap;

class LRUCache {

    class Node {

        int key;
        int value;

        Node prev;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private int capacity;

    private HashMap<Integer, Node> map;

    private Node head;
    private Node tail;

    public LRUCache(int capacity) {

        this.capacity = capacity;

        map = new HashMap<>();

        // dummy nodes
        head = new Node(0, 0);
        tail = new Node(0, 0);

        head.next = tail;
        tail.prev = head;
    }

    // Add node right after head
    private void addNode(Node node) {

        node.prev = head;
        node.next = head.next;

        head.next.prev = node;
        head.next = node;
    }

    // Remove node
    private void removeNode(Node node) {

        node.prev.next = node.next;
        node.next.prev = node.prev;

    }

    

    // Remove least recently used node
    private Node popTail() {

        Node res = tail.prev;

        removeNode(res);

        return res;
    }

    public int get(int key) {

        if (!map.containsKey(key)) {
            return -1;
        }

        Node node = map.get(key);

        removeNode(node);
        addNode(node);

        return node.value;
    }

    public void put(int key, int value) {

        if (map.containsKey(key)) {

            Node node = map.get(key);

            node.value = value;

            removeNode(node);
            addNode(node);
        }
        else {

            Node newNode = new Node(key, value);

            map.put(key, newNode);

            addNode(newNode);

            // remove LRU if capacity exceeded
            if (map.size() > capacity) {

                Node tailNode = popTail();

                map.remove(tailNode.key);
            }
        }
    }
}

/**
 * Your LRUCache object will be instantiated and called as such:
 * LRUCache obj = new LRUCache(capacity);
 * int param_1 = obj.get(key);
 * obj.put(key,value);
 */
