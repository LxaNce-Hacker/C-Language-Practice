bool isPalindrome(int x) {
    if(x<0) return false;

    double rev=0,temp, org=x;
    while(x!=0)
    {
        temp=x%10;
        rev=rev*10+temp;
        x=x/10;
    }

    return rev==org;
}
