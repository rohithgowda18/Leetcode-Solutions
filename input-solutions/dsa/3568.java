class Solution {
    static class State {
        int r, c, e, mask;

        State(int r, int c, int e, int mask) {
            this.r = r;
            this.c = c;
            this.e = e;
            this.mask = mask;
        }
    }

    public int minMoves(String[] classroom, int energy) {
        int m = classroom.length, n = classroom[0].length();
        int sr = 0, sc = 0, cnt = 0;
        int[][] id = new int[m][n];

        for (int[] a : id) Arrays.fill(a, -1);

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                char ch = classroom[i].charAt(j);
                if (ch == 'S') {
                    sr = i;
                    sc = j;
                } else if (ch == 'L') {
                    id[i][j] = cnt++;
                }
            }
        }

        int full = (1 << cnt) - 1;
        int[][][] best = new int[m][n][1 << cnt];

        for (int[][] a : best)
            for (int[] b : a)
                Arrays.fill(b, -1);

        Queue<State> q = new LinkedList<>();
        q.offer(new State(sr, sc, energy, 0));
        best[sr][sc][0] = energy;

        int[] dr = {1, -1, 0, 0};
        int[] dc = {0, 0, 1, -1};
        int moves = 0;

        while (!q.isEmpty()) {
            int size = q.size();

            while (size-- > 0) {
                State cur = q.poll();

                if (cur.mask == full) return moves;
                if (cur.e == 0) continue;

                for (int d = 0; d < 4; d++) {
                    int r = cur.r + dr[d], c = cur.c + dc[d];

                    if (r < 0 || r >= m || c < 0 || c >= n ||
                        classroom[r].charAt(c) == 'X') continue;

                    int e = cur.e - 1, mask = cur.mask;
                    char ch = classroom[r].charAt(c);

                    if (ch == 'L')
                        mask |= 1 << id[r][c];

                    if (ch == 'R')
                        e = energy;

                    if (e <= best[r][c][mask]) continue;

                    best[r][c][mask] = e;
                    q.offer(new State(r, c, e, mask));
                }
            }
            moves++;
        }

        return -1;
    }
}
