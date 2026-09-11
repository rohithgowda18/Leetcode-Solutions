class Solution {
    int ans=0;
    public int totalNQueens(int n) {
        char[][] board=new char[n][n];
        for(int i=0;i<n;i++)Arrays.fill(board[i],'.');

        solve(board,0);

        return ans;
    }
    
    void solve(char[][] board,int i){
        if(i==board.length){
            ans++;
            return;
        }

        for(int j=0;j<board.length;j++){
            if(isSafe(board,i,j)){
                board[i][j]='Q';

                solve(board,i+1);

                board[i][j]='.';
            }
        }

    }

    boolean isSafe(char[][] board,int i,int j){

        for(int r=0;r<i;r++){
            if(board[r][j]=='Q')return false;
        }

        for(int r=i-1,c=j-1;r>=0 && c>=0;r--,c--)if(board[r][c]=='Q')return false;

        for(int r=i-1,c=j+1;r>=0 && c<board.length;r--,c++)if(board[r][c]=='Q')return false;

        return true;
    }
}
