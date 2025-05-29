-- Create submissions table
CREATE TABLE submissions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    amount DECIMAL(18,2) NOT NULL,
    reason NVARCHAR(MAX) NOT NULL,
    approver NVARCHAR(50) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    manager_approval BIT DEFAULT 0,
    cio_approval BIT DEFAULT 0,
    cfo_approval BIT DEFAULT 0,
    final_approver NVARCHAR(50) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Create indexes for better performance
CREATE INDEX idx_submissions_amount ON submissions(amount);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_approver ON submissions(approver); 