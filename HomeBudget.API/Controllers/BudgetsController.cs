using HomeBudget.API.Data;
using HomeBudget.API.DTOs;
using HomeBudget.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BudgetsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BudgetsController(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<BudgetResponseDto> BudgetResponses()
        {
            return _context.Budgets
                .AsNoTracking()
                .Select(b => new BudgetResponseDto
                {
                    Id = b.Id,
                    ExpenseCategoryId = b.ExpenseCategoryId,
                    ExpenseCategoryName = b.ExpenseCategory.Name,
                    Month = b.Month,
                    Year = b.Year,
                    Amount = b.Amount,
                    Notes = b.Notes,

                    Spent = _context.Expenses
                        .Where(e =>
                            e.ExpenseCategoryId == b.ExpenseCategoryId &&
                            e.ExpenseDate.Year == b.Year &&
                            e.ExpenseDate.Month == b.Month)
                        .Sum(e => (decimal?)e.Amount) ?? 0m
                });
        }

        [HttpGet]
        public async Task<ActionResult<List<BudgetResponseDto>>> GetAll(
            [FromQuery] int? year,
            [FromQuery] int? month)
        {
            if (year.HasValue &&
                (year.Value < 2000 || year.Value > 2100))
            {
                return BadRequest(new
                {
                    message = "Year must be between 2000 and 2100."
                });
            }

            if (month.HasValue &&
                (month.Value < 1 || month.Value > 12))
            {
                return BadRequest(new
                {
                    message = "Month must be between 1 and 12."
                });
            }

            var query = BudgetResponses();

            if (year.HasValue)
            {
                query = query.Where(b => b.Year == year.Value);
            }

            if (month.HasValue)
            {
                query = query.Where(b => b.Month == month.Value);
            }

            var budgets = await query
                .OrderByDescending(b => b.Year)
                .ThenByDescending(b => b.Month)
                .ThenBy(b => b.ExpenseCategoryName)
                .ToListAsync();

            return Ok(budgets);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<BudgetResponseDto>> GetById(int id)
        {
            var budget = await BudgetResponses()
                .FirstOrDefaultAsync(b => b.Id == id);

            if (budget == null)
            {
                return NotFound(new
                {
                    message = "Budget not found."
                });
            }

            return Ok(budget);
        }

        [HttpPost]
        public async Task<ActionResult<BudgetResponseDto>> Create(
            BudgetCreateDto dto)
        {
            if (decimal.Round(dto.Amount, 3) != dto.Amount)
            {
                return BadRequest(new
                {
                    message = "Amount must have no more than 3 decimal places."
                });
            }

            var category = await _context.ExpenseCategories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == dto.ExpenseCategoryId);

            if (category == null || !category.IsActive)
            {
                return BadRequest(new
                {
                    message = "Please select an existing, active expense category."
                });
            }

            var exists = await _context.Budgets.AnyAsync(b =>
                b.ExpenseCategoryId == dto.ExpenseCategoryId &&
                b.Year == dto.Year &&
                b.Month == dto.Month);

            if (exists)
            {
                return Conflict(new
                {
                    message = "A budget already exists for this category and month."
                });
            }

            var budget = new Budget
            {
                ExpenseCategoryId = dto.ExpenseCategoryId,
                Month = dto.Month,
                Year = dto.Year,
                Amount = dto.Amount,
                Notes = dto.Notes?.Trim()
            };

            _context.Budgets.Add(budget);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is SqlException sql &&
                      (sql.Number == 2601 || sql.Number == 2627))
            {
                return Conflict(new
                {
                    message = "A budget already exists for this category and month."
                });
            }

            var response = await BudgetResponses()
                .SingleAsync(b => b.Id == budget.Id);

            return CreatedAtAction(
                nameof(GetById),
                new { id = budget.Id },
                response);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<BudgetResponseDto>> Update(
            int id,
            BudgetUpdateDto dto)
        {
            if (decimal.Round(dto.Amount, 3) != dto.Amount)
            {
                return BadRequest(new
                {
                    message = "Amount must have no more than 3 decimal places."
                });
            }

            var budget = await _context.Budgets.FindAsync(id);

            if (budget == null)
            {
                return NotFound(new
                {
                    message = "Budget not found."
                });
            }

            budget.Amount = dto.Amount;
            budget.Notes = dto.Notes?.Trim();

            await _context.SaveChangesAsync();

            var response = await BudgetResponses()
                .SingleAsync(b => b.Id == budget.Id);

            return Ok(response);
        }
    }
}